Use NVM and Node 16

Link core package to global (Node 16) node_module

```
cd game
npm link
```

In frontend and server packages, link to core and then install

```
npm link @madrigal/core
npm install
```

Local tar ball of @madrigal/core will be built and inserted into frontend and server before deploying to App Engine using `npm run deploy`
