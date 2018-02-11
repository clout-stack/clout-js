# Create API Endpoint
> Creating an api shouldn't be complication. We have found you an elegent standardized solution.

1) Create a new file in the ```api/``` directory

2) Add the following to the file
e.g. hello.js
```
module.exports = {
    get: {
        path: '/hello',
        method: 'get',
        fn(req, resp) {
            resp.ok('world');
        }
    }
};
```

3) Lets create another endpoint
```
...
    anotherGet: {
        path: '/hello/:postcode:',
        method: 'get',
        fn(req, resp) {
            resp.ok(`world from ${req.params.postcode}`);
        }
    }
...
```

4) Lets test it
After restarting the application, you should be able to call the following urls.
- [http://localhost:8080/api/hello](http://localhost:8080/api/hello)
- [http://localhost:8080/api/hello/e11pa](http://localhost:8080/api/hello/e11pa)
