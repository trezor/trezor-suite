const path = require('path');

require('ts-node').register({
    transpileOnly: true,
    project: path.join(__dirname, 'tsconfig.json'),
});

module.exports = require('./rules').rules;
