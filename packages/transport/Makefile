check: node_modules
	flow check src/
	cd src/; eslint .

git-ancestor:
	git fetch origin
	git merge-base --is-ancestor origin/master master

node_modules:
	npm install

build: node_modules
	rm -rf lib
	cp -r src/ lib
	find lib/ -type f ! -name '*.js' | xargs -I {} rm {}
	find lib/ -name '*.js' | xargs -I {} mv {} {}.flow
	`npm bin`/babel src --out-dir lib
	rm -rf lib/flow-test

npm_preversion: git-ancestor check build

npm_version: build
	git add -A lib
	git commit -m 'Build'

npm_postversion:
	git push
	git push --tags
	npm publish
