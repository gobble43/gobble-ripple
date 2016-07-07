[![Build Status](https://travis-ci.org/gobble43/gobble-ripple.svg?branch=master)](https://travis-ci.org/gobble43/gobble-ripple)

[![Stories in Ready](https://badge.waffle.io/gobble43/gobble-ripple.png?label=ready&title=Ready)](https://waffle.io/gobble43/gobble-ripple)

# Microservice Name
gobble-ripple

## Table of Contents
1. [Getting started](#getting-started)
2. [Tech](#tech)
3. [Database Schema](#database-schema)
4. [Team](#team)
5. [Contributing](#contributing)

## Getting started

Clone and install dependencies:
```sh
$ git clone https://github.com/gobble43/gobble-ripple.git
$ cd gobble-ripple
$ npm install
```
Create `env/development.env` and set environment variables. Follow `env/example.env`.

add any additional needed commands and instructions here

```sh
$ redis-server
$ npm start
```

#### Testing

Configure the environment variable `NODE_ENV` prior to running tests.

 ```sh
$ export NODE_ENV=development
$ npm test
```

## Tech
> Node / Express server
> Node clusters for master worker setup
> Redis for worker queues
> Socket.io for realtime communication between server and clients
> Travis, Mocha & Chai for testing

## Database Schema
> Add schema for application db here

## Directory Layout
> Use the diagram below as an example and starting point
```
├── /env/                       # Environment variables
├── /node_modules/              # 3rd-party libraries and utilities
├── /dist/                      # Public distribution folder
│   ├── index.html              # Index page for testing
│
├── /lib/                       # Library
│   ├── geo.js                  # Methods for geographical calculations such as geohashing
│   ├── collision.js            # Methods for polygon collison
│
├── /server/                    # Server source code
│   ├── /httpServer/            # Express server
│     ├── /config/              # Server configs
│       ├── middleware.js       # Server middleware
│       ├── routes.js           # Server routes
│       ├── socket.js           # Socket server
│     ├── /controllers/         # Http server controllers
│       ├── postController.js   # Functions for interacting with posts in the database
│     ├── server.js             # Start the server
│   ├── /postWorker/            # Post worker
│       ├── worker.js           # Proccesses new posts comming in a calculates ripple collisons
│   ├── master.js               # Start entire server, with post worker and upload worker clusters
│
├── /test/                      # Testing folder
│   ├── app-spec.js             # Supertest tests
│   ├── setup.js                # Setup for tests
├── package.json                # List of 3rd party libraries and utilities to be installed
├── .eslintrc.js                # Eslint settings extending airbnb
├── package.json                # List of 3rd party libraries and utilities to be installed
└── .eslintrc.json              # ESLint settings
```

## Team
  - Product Owner:            [Leo Adelstein](https://github.com/leoadelstein)
  - Scrum Master:             [Jack Zhang](https://github.com/jackrzhang)
  - Development Team Members: [Leo Adelstein](https://github.com/leoadelstein), [Jinsoo Cha](https://github.com/jinsoocha), [Will Tang](https://github.com/willwtang), [Jack Zhang](https://github.com/jackrzhang)

## Contributing
See [CONTRIBUTING.md](https://github.com/gobble43/docs/blob/master/STYLE-GUIDE.md) for contribution guidelines.