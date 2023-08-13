Use NVM and Node 16


In frontend and server packages:

Core package @madrigal/core is built from `game` directory. It is *not* an explicit dependency in server and frontend packages because deployment and local dev environment install it differently.

Production (npm deploy):  
Pack @madrigal/core and install from tarball. Reference file path in package.json. This is done automatically by `npm deploy`

packge.json will now have changes that can safely be ignored (git co package.json)

Dev environment:  

Link core package to global (Node 16) node_module

```
cd game
npm link
```


Run `npm install` and then `npm link @madrigal/core` to point it to global link setup previously by `npm link` in `game/` dir.


