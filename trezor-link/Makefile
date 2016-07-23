check: node_modules
	flow check src/
	eslint src/*.js

node_modules:
	npm install

build:
	rm -rf dist
	mkdir -p dist
	`npm bin`/browserify src/index.js > dist/index.js
