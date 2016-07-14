check: node_modules
	flow check src/
	eslint src/*.js

node_modules:
	npm install

build-browser:
	`npm bin`/browserify src/index.js > dist/index.js

build-node:
	`npm bin`/babel src --out-dir lib
