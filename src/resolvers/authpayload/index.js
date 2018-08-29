// AuthPayload

const user = (
    { user: id },
    args,
    context,
    info) => context.db.query.user({ where: { id } }, info)

module.exports = {
    user,
}
