// Mutation
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { APP_SECRET, getUserId } = require('./../../utils')

// User Management

const signup = async (
    root,
    { // args
        name,
        email,
        password,
    },
    context,
    info
) => {
    if (await context.db.exists.User({ email })) throw new Error('A user with the same email address already exists')
    if (!password) throw new Error('Invalid password entry')
    const minPasswordLimit = 6
    if (password.length < minPasswordLimit) throw new Error(`The password is too short (min ${ minPasswordLimit })`)
    const securedPassword = await bcrypt.hash(password, 10)
    const user = await context.db.mutation.createUser(
    {
        data: {
            name,
            email,
            password: securedPassword,
        },
    }, `{ id }`)
    const token = jwt.sign({ userId: user.id }, APP_SECRET)
    return {
        token,
        user,
    }
}

const login = async (
    parent,
    {
        email,
        password,
    },
    context,
    info
) => {
    const user = await context.db.query.user(
        { where: { email } },
        `{ id password }`
    )
    if (!user) throw new Error('User not found')

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) throw new Error('Invalid password')

    const token = jwt.sign({ userId: user.id }, APP_SECRET)

    return {
        token,
        user,
    }
}

// Helpers

const goalExists = async (context, id, userId) =>
    await context.db.exists.Goal({ id, createdBy: { id: userId } })

const playerExists = async (context, id, userId, name = null) =>
    await context.db.exists.Player((name)
        ? { name, createdBy: { id: userId } }
        : { id, createdBy: { id: userId } })

const teamExists = async (context, id, userId, name = null) =>
    await context.db.exists.Team((name)
        ? { name, createdBy: { id: userId } }
        : { id, createdBy: { id: userId } })

const getGoalById = async (context, id) => await context.db.query.goal({ where: { id } }, `{ id }`)
const getPlayerById = async (context, id) => await context.db.query.player({ where: { id } }, `{ id }`)
const getPlayerByName = async (context, name) => (await context.db.query.players({ where: { name } }, `{ id }`))[0]
const getTeamById = async (context, id) => await context.db.query.team({ where: { id } }, `{ id, name, players { id name }, teamColor }`)
const getTeamByName = async (context, name) => (await context.db.query.teams({ where: { name } }, `{ id, name, players { id name }, teamColor }`))[0]
const getMatchById = async (context, id) => await context.db.query.match({ where: { id } }, `
{
    id
    name
    timeActive
    teams {
        id
        name
        teamColor
        players {
            id
            name
        }
    }
    goals {
        id
        player { id }
        team { id }
    }
    createdBy {
        id
        name
    }
    createdAt
}
`)

const queryPlayer = async (context, { id, name }, userId) => {
    const trimmedName = name.trim()
    const playerExistsWithName = await playerExists(context, id, userId, trimmedName)
    const playerExistsWithId = await playerExists(context, id, userId)
    let player = null
    if (!name || trimmedName === '') (() => { throw new Error('Player missing name') })()
    player = (playerExistsWithName) ? ((playerExistsWithId) ? await getPlayerById(context, id) : await getPlayerByName(context, name)) : await getPlayerById(context, id)
    return (player === null) ? player : { id: player.id }
}

const createNewPlayer = async (context, { name }) => {
    const userId = getUserId(context)
    const trimmedName = name.trim()
    return await context.db.mutation.createPlayer(
        {
            data: {
                name: trimmedName,
                createdBy: {
                    connect: {
                        id: userId,
                    },
                },
            },
        },
        `{
            id
        }`,
    )
}

const queryOrCreatePlayer = async (context, { id, name }) => {
    const userId = await getUserId(context)
    let player = null
    player = await queryPlayer(context, { id, name }, userId)
    if (player === null) {
        player = await createNewPlayer(context, { name })
    }
    if (!player) throw new Error(`Could not create player with id: ${ id } name: ${ name }`)
    return {
        id: player.id
    }
}

const queryTeam = async (context, { id='1234', name='' }, userId) => {
    const trimmedName = name.trim()
    const teamExistsWithName = (trimmedName === '') ? false : await teamExists(context, id, userId, trimmedName)
    const teamExistsWithId = await teamExists(context, id, userId)
    let team = null
    team = (teamExistsWithName) ? ((teamExistsWithId) ? await getTeamById(context, id) : await getTeamByName(context, name)) : await getTeamById(context, id)
    return team
}

const queryOrCreateTeam = async (context, { id, name, players, teamColor='#c05a5a' }) => {
    const userId = await getUserId(context)
    const maxPlayerLimit = 4
    const minPlayerLimit = 1

    if (!players.length) throw new Error('Team is missing players')
    if (players.length < minPlayerLimit) throw new Error(`A team can consist of ${ minPlayerLimit }-${ maxPlayerLimit } players`)
    if (players.length > maxPlayerLimit) throw new Error(`A team can only consist of maximum ${ maxPlayerLimit } players`)
    let playerList = []
    for(const player of players) {
        playerList.push(await queryOrCreatePlayer(context, player))
    }
    if (!playerList.length) throw new Error(`Failure making players: ${ playerList }`)

    let team = await queryTeam(context, { id, name }, userId)

    if(team) {
        await context.db.mutation.updateTeam({
            where: { id: team.id },
            data: {
                players: {
                    connect: [ ...playerList ]
                }
            },
        }, `{ id, name, players { id name }, teamColor }`)
        team = await queryTeam(context, { id, name }, userId)
    } else {
        team = await context.db.mutation.createTeam(
        {
            data: {
                name,
                teamColor,
                players: {
                    connect:
                    [ ...playerList ]
                },
                createdBy: {
                    connect: {
                        id: userId,
                    },
                },
            },
        }, `{ id, name, players { id name }, teamColor }`)
    }
    if(!team) throw new Error('Failed to retrieve team.')

    return team
}

const queryOrCreateGoal = async (context, { id, time, player, team, points=1, match }) => {
    const userId = await getUserId(context)
    const aPlayer = await queryPlayer(context, player)
    if (!aPlayer) throw new Error(`Failure making player: ${ player }`)
    const aTeam = await queryTeam(context, team)
    const goal = (await goalExists(context, id, userId))
    ? await getGoalById(context, id)
    : await context.db.mutation.createGoal({
        data: {
            match: {
              connect: { id: match },
            },
            time,
            player: {
              connect: { id: aPlayer.id },
            },
            team: {
              connect: { id: aTeam.id }
            },
            points: points,
            createdBy: {
              connect: {
                id: userId
              },
            },
        }
        }, `{ id }`)
    if (!goal) throw new Error('Failed to retrieve goal.')
    return {
        id: goal.id,
    }
}

const queryOrCreateMatch = async (context, { id, name, timeActive, teamIdList }) => {
    const userId = getUserId(context)
    const matchExistsWithId = await context.db.exists.Match({ id })
    return (matchExistsWithId)
    ? await getMatchById(context, id, userId)
    : await context.db.mutation.createMatch({
        data: {
            name,
            timeActive,
            teams: { connect: teamIdList },
            goals: [],
            createdBy: {
                connect: {
                    id: userId,
                },
            }
        }
    },
`
{
    id
    name
    timeActive
    teams {
        id
        name
        teamColor
        players {
            id
            name
        }
    },
    goals {
        id
        player { id }
        team { id }
    },
    createdBy {
        id
        name
    }
    createdAt
}
`)
}

// Player

const createPlayer = async (parent, args, context, info) =>
    await queryOrCreatePlayer(context, args)

// Team

const createTeam = async (parent, { input }, context, info) =>
    await queryOrCreateTeam(context, input)

// Goal

const createGoal = async (parent, { input }, context, info) =>
    await queryOrCreateGoal(context, input)

// Match

const createMatch = async (parent,
{
    input: {
        id = '1234',
        name = '',
        timeActive = 0,
        teams = [],
        goals = [],
    }
}, context, info) => {
    const userId = await getUserId(context)
    const teamsLength = teams.length
    const maxTeamLimit = 2
    const minTeamLimit = maxTeamLimit

    if(!teamsLength) throw new Error('Missing teams')
    if(teamsLength < minTeamLimit) throw new Error(`Insufficient number of teams. The minimum is ${ minTeamLimit }`)
    if(teamsLength > maxTeamLimit) throw new Error(`Exceeding the maximum number of teams per match (max ${ maxTeamLimit })`)

    let teamMap = new Map() // We'll need the old temporary ids for reference in goals as we don't enforce name for the team to find newly created teams.
    for (const team of teams) {
        teamMap.set(team.id, await queryOrCreateTeam(context, team))
    }

    const teamMapLength = teamMap.size
    if(!teamMapLength) throw new Error('Missing teams in map')
    if(teamMapLength < minTeamLimit) throw new Error('Insufficient number of teams retrieved')
    if(teamMapLength > maxTeamLimit) throw new Error(`Exceeding the maximum number of teams per match in response (max ${ maxTeamLimit })`)
    const teamIdList = [ ...teamMap.values() ].map(team => ({ id: team.id }))

    const match = await queryOrCreateMatch(context, { id, name, timeActive, teamIdList })
    const matchId = match.id

    const goalList = []

    await clearGoalsForMatch(context, matchId) // TODO: Remove when update method is implemented

    for (const goal of goals) {
        goal.team = teamMap.get(goal.team.id) // Replace with the newly created team referencing to the old id.
        goal.match = matchId
        const newGoal = await queryOrCreateGoal(context, goal)
        if (newGoal) goalList.push(newGoal)
    }

    const updateData = { goals: {} }

    if (goalList.length > 0) {
        updateData.goals.connect = goalList
    }

    if (match.timeActive !== timeActive) { updateData.timeActive = timeActive }

    await context.db.mutation.updateMatch({
        where: {
            id: matchId,
        },
        data: updateData,
    }, `{ id }`)

    return { id: matchId }
}

const clearGoalsForMatch = async (context, id) => {
    await context.db.mutation.deleteManyGoals({ where: { match: { id } } }, `{ count }`)
}

const resetMatch = async (parent, { id }, context, info) => {
    await getUserId(context)
    await context.db.mutation.deleteManyGoals({ where: { match: { id } } }, `{ count }`)
    return await context.db.mutation.updateMatch({ where: { id }, data: { goals: [], timeActive: 0 } },
        `{
            id
            name
            timeActive
            teams {
                id
                name
                players {
                    id
                    name
                }
            }
            goals {
                id
                time
                match {
                    id
                    name
                }
                player {
                    id
                    name
                }
                team {
                    id
                    name
                }
                points
                createdAt
            }
        }`)
}

const deleteMatch = async (parent, { id }, context, info) => {
    await getUserId(context)
    return await context.db.mutation.deleteMatch({ where: { id } }, `{ id }`)
}

module.exports = {
    signup,
    login,
    createPlayer,
    createTeam,
    createGoal,
    createMatch,
    resetMatch,
    deleteMatch,
}
