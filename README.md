Use NVM and Node 16 (nvm use 16)

Project consists of 3 npm packages

- @madrigal/core
- @madrigal/frontend
- @madrigal/server

Core contains game logic and is a dependency of frontend and server. Server and frontend are deployed with App Engine. Frontend is a React app and backend a simple Express server.

First install core with `npm install` inside `game`.

In frontend and server packages:

Core package @madrigal/core is built from `game` directory. It is *not* an explicit dependency in server and frontend package.json because deployment and local dev environment install it differently.

### Production

The core package has to be packed up and uploaded so App Engine can install it on server side. Any relative references to `../game` dir will break in deployment.

Pack @madrigal/core (`npm pack ../game`) and install from tarball, saving the path and hash in package.json dependency list. This is done automatically by `npm deploy`.

packge.json and package-lock.json will now have changes for the added dependency that can safely be ignored (git co package.json). If you want to keep developing locally, do `npm link @madrigal/core` again.

### Dev environment

Link core package to global (Node 16) node_module

```
cd game
npm install
npm link
```


In each of frontend and server dirs:  
Run `npm install` and then `npm link @madrigal/core` to point it to global link setup previously by `npm link` in `game/` dir.


