const myFetch = require('isomorphic-fetch');

function run(stuff) {
    return myFetch('http://localhost:1234', {
        method: 'post',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(stuff),
    }).then(res => res.json());
}

module.exports = {run: run};
