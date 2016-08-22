check: node_modules
	flow check src/
	cd src/; eslint .

node_modules:
	npm install

build: node_modules
	rm -rf lib
	cp -r src/ lib
	find lib/ -type f ! -name '*.js' | xargs -I {} rm {}
	find lib/ -name '*.js' | xargs -I {} mv {} {}.flow
	BABEL_ENV=srctolib `npm bin`/babel src --out-dir lib
	rm -rf lib/flow-test

npm_preversion: check build

npm_version: build
	git add -A lib
	git commit -m 'Build'

npm_postversion:
	git push
	git push --tags
	npm publish
