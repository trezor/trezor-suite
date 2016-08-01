check: node_modules
	flow check src/
	cd src/; eslint .

node_modules:
	npm install

build:
	rm -rf dist
	cp -r src/ dist
	find dist/ -type f ! -name '*.js' | xargs -I {} rm {}
	find dist/ -name '*.js' | xargs -I {} mv {} {}.flow
	`npm bin`/browserify src/index.js > dist/index.js
