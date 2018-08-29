# Table Football – GraphQL API Server
This server was intended as a supporting backend service for the [Table Football React Web App front-end](https://github.com/R-H-T/football) project I made earlier. Both are still work in progress, the `master`-branch contains the stable version of the project.

![][image-1]

---

### Index:
  * **[Table Football – GraphQL API Server](#table-football-–-graphql-api-server)**
  * **[Getting Started](#getting-started)**
    * **[Setup (Step-by-Step)](#setup-step-by-step)**
      - [1. Node.JS 📦](#1-nodejs-📦)
      - [2. Docker & Docker Compose 🐳](#2-docker-&-docker-compose-🐳)
      - [3. Prisma🔺](#3-prisma🔺)
    * **[Start the GraphQL API Server 🖲](#start-the-graphql-api-server-🖲)**
      - [Start The Server](#start-the-server)
      - [Example GraphQL Queries](#example-graphql-queries)
      - [Direct Access](#direct-access)
  * **[Future Plans](#future-plans)**
  * **[Licence](#license)**

---

# Getting Started

# Setup (_Step-by-Step_)
Run all the terminal commands within the project root directory.

## 1. Node.JS 📦
This Project was developed using **Node v8.11.3**.
<small>(_see [https://nodejs.org](https://nodejs.org) for how to setup **Node**_)</small>
### Upgrade `npm` to the latest version (_Recommended_):
```sh
$ sudo npm i -g npm@latest
```
### Install The Global Dependencies:
```sh
$ sudo npm i -g prisma@ graphql-cli
```
### Install Project Dependencies:
```sh
$ npm i
```

## 2. Docker & Docker Compose 🐳

#### Mac & Windows Users
See **Docker** for easy setup instructions for **Mac** & **Windows** users (_[https://www.docker.com/get-started](https://www.docker.com/get-started)_).

#### Linux Users:

**Auto-detected by script:**
```sh
$ curl -fsSL get.docker.com -o get-docker.sh && sh det-docker.sh
```
<small>(_**Note:** Verify that https://get.docker.com is the same script as_ `install.sh` _at [https://github.com/docker/docker-install](https://github.com/docker/docker-install) before you run this command_).</small>

**Ubuntu:**
```sh
$ apt-get update && apt-get upgrade && apt-get install docker python-pip && pip install docker-compose
```

**Alpine Linux:**
```sh
$ apk update && apk upgrade && apk add docker py-pip && pip install docker-compose
```
**Docker Compose** runs the **GraphQL Database Container** (*aka the Data Layer*) – which will be directly connected with our GraphQL API Backend (*aka the Business Layer containing all the logic, and filtering the access to the Data Layer*).
### Run the following command to start the server:
```sh
$ cd database; docker-compose up -d; cd -
```

## 3. Prisma🔺
This was installed in the steps specified for _**[1. Node.JS](#node)**_. *Prisma* will generate some files to to the `src/generated` directory based on your schema specifications inside the `database/prisma.graphql` file.
### Deploy the existing database schema:
```sh
$ prisma deploy
```

---

# Start The GraphQL API Server 🖲
Make sure that the docker-compose containers are up and running the command `$ docker-compose ps`.

### Start The Server
```sh
$ npm start
```

The project should be running on [http://localhost:3001](http://localhost:3001) and you should see a GraphQL playground to test your queries.

### Example GraphQL Queries
```gql
query getInfo {
  info
}

query allPlayers {
  players {
    id
    name
  }
}
```
<small>(_**Note:** See the GraphQL Playground Schema-tab or the source code's `src/schema.graphql` file for available queries, mutations, inputs, subscriptions, etc. Run the signup query to retrieve an `Authorization` token for the Headers section inside the playground, add eg.: `{ "Authorization" : "Bearer YOUR-AUTH-TOKEN-HERE" }`_)</small>

### Direct Access
To directly access the data layer, run the following commands:
```sh
$ prisma playground
```
This fires up another playground for directly modifying the database. Though, in order to send queries – you'll need an authorization token. Run the following command to generate one:
```sh
$ prisma token
```
Add that token to the GraphQL Playground's Headers section, eg.:
```json
  { "Authorization" : "Bearer YOUR-AUTH-TOKEN-HERE" }
```

Enjoy!

---

## Future Plans
Planning to make this project run within its own Docker container or/and just deploy it to Heroku and Amazon Web Services (AWS). And do some API documentation.

---

# License
**TBD**
Copyright ©2018 – Roberth Hansson-Tornéus – [R-H-T](github.com/R-H-T) (Gawee.Narak@gmail.com)

[image-1]: r-h-t_tablefootball_md.png
