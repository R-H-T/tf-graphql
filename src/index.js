const { GraphQLServer } = require('graphql-yoga')
const { Prisma } = require('prisma-binding')

const server = new GraphQLServer({
    typeDefs: './src/schema.graphql',
    resolvers: require('./resolvers'),
    context: req => ({
        ...req,
        db: new Prisma({
            typeDefs: 'src/generated/prisma.graphql',
            endpoint: 'http://0.0.0.0:4466',
            secret: '8SwsrZCLlqWGioBxHJKOm8xmGPrE3Hq',
            debug: true,
        }),
    }),
})

server.start(
    {
        port: 3001,
    },
    () => console.log(`Server is running on http://localhost:3001`)
)
