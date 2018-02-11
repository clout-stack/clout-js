# Create Project Scaffold
> Creating an api shouldn't be complication. We have found you an elegent standardized solution.

1) Create a new project directory and initialize npm and git
```bash
mkdir myserver
cd myserver
npm init (set server.js as main)
git init
```

2) create the following directories and files
- conf/default.js

```node
module.exports = {
    session: 'mysessionsecret'
};
```

- server.js

```node
const clout = require('clout-js');

clout.on('started', () => {
    let server = clout.server['http'];
    if (server) {
        let port = server.address().port;
        console.info('%s server started on port %s', key, port);
    }
});

clout.start();
```

2) Install clout-js
```bash
npm install clout-js@beta --save
```

2) Start the server
```
node .
```

4) Test it by visiting [http://localhost:8080](http://localhost:8080) shoud return a 404 page from clout-js
