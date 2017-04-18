'use strict';

const http = require('http');
const exec = require('child_process').exec;

const server = http.createServer(function (request, response) {
    response.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'content-type',
    });

    let queryData = '';

    if (request.method === 'POST') {
        request.on('data', function (data) {
            queryData += data;
            if (queryData.length > 1e6) {
                queryData = '';
                response.write('"error"');
                response.end();
                request.connection.destroy();
            }
        });

        request.on('end', function () {
            const postdata = JSON.parse(queryData);
            if (typeof postdata === 'string') {
                const bashdata = postdata.replace(/'/g, "'" + '"' + "'" + '"' + "'");
                exec("/bin/bash -c '" + bashdata + "' 2>&1", function (er, stdout) {
                    response.write(JSON.stringify(stdout));
                    response.end();
                });
            } else {
                response.write('"error"');
                response.end();
            }
        });
    } else {
        response.write('"error"');
        response.end();
    }
});

server.listen(1234);
