check: node_modules
	flow check lib/
	eslint lib/*.js

node_modules:
	npm install

build:
	`npm bin`/browserify lib/index.js > dist/index.js
