// Query
const { getUserId } = require('./../../utils')

const info = () => 'Table Football – GraphQL API Server - A Score Tracking GraphQL API Backend by Roberth Hansson-Tornéus (https://github.com/R-H-T) – ©2018'

const users = async (root, args, context, info) => {
    const selectionSet =
    `{
        id
        name
        email
        createdAt
        roles
        players {
          id
          name
        }
        associatedPlayers {
          id
          name
        }
    }
    `
    return await context.db.query.users({}, selectionSet)
}

const userExists = async (root, { email }, context, info) => {
    return await context.db.exists.User({ email })
}

const players = async (root, args, context, info) => {
    const userId = await getUserId(context) // Only authorized user
    const selectionSet =
    `{
        id
        name
        createdAt
        createdBy {
            id
            name
        }
        associatedUser {
            id
            name
        }
    }
    `
    return await context.db.query.players({ where: { createdBy: { id: userId } } }, selectionSet)
}

const goals = async (root, args, context, info) => {
    const userId = await getUserId(context) // Only authorized user
    const selectionSet =
    `
    {
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
    `
    return await context.db.query.goals({ where: { createdBy: { id: userId } } }, selectionSet)
}

const teams = async (root, args, context, info) => {
    const userId = await getUserId(context) // Only authorized user
    const selectionSet =
    `{
        id
        name
        createdAt
        players {
          id
          name
        }
        teamColor
    }
    `
    return await context.db.query.teams({ where: { createdBy: { id: userId } } }, selectionSet)
}

const matches = async (root, args, context, info) => {
    const userId = await getUserId(context) // Only authorized user
    const selectionSet =
    `{
        id
        name
        timeActive
        createdAt
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
    }
    `
    return await context.db.query.matches({ where: { createdBy: { id: userId } } }, selectionSet)
}

const match = async (root, args, context, info) => {
    const userId = await getUserId(context) // Only authorized user
    const selectionSet =
    `{
        id
        name
        timeActive
        createdAt
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
    }
    `
    return (await context.db.query.matches({ where: { id: args.id, createdBy: { id: userId } } }, selectionSet))[0]
}

module.exports = {
    info,
    users,
    userExists,
    players,
    goals,
    teams,
    matches,
    match,
}
