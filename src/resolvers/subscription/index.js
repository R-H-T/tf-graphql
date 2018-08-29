
const newMatchSubscribe = (parent, args, context, info) =>
    context.db.subscription.match(
        { where: { mutation_in: ['CREATED'] } },
        info,
    )

const newMatch = {
    subscribe: newMatchSubscribe,
}

module.exports = {
    newMatch,
}
