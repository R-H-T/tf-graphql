const { GraphQLServer } = require('graphql-yoga')

const server = new GraphQLServer({
    typeDefs: './src/schema.graphql',
    resolvers: require('./resolvers'),
})

server.start(
    {
        port: 3001,
    },
    () => console.log(`Server is running on http://localhost:3001`)
)
