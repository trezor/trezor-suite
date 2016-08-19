check: node_modules
	flow check src/
	cd src/; eslint .

node_modules:
	npm install

build:
	rm -rf lib
	cp -r src/ lib
	find lib/ -type f ! -name '*.js' | xargs -I {} rm {}
	find lib/ -name '*.js' | xargs -I {} mv {} {}.flow
	`npm bin`/babel src --out-dir lib
	rm -rf lib/flow-test
