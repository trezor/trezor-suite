flow: node_modules
	`npm bin`/flow check src/

eslint: node_modules
	cd src/; `npm bin`/eslint .

git-ancestor:
	git fetch origin
	git merge-base --is-ancestor origin/master master

node_modules:
	yarn

yarn:
	yarn

build: node_modules
	rm -rf lib
	cp -r src/ lib
	find lib/ -type f ! -name '*.js' | xargs -I {} rm {}
	find lib/ -name '*.js' | xargs -I {} mv {} {}.flow
	`npm bin`/babel src --out-dir lib
	rm -r lib/flow-test

.version: yarn git-clean git-ancestor flow eslint build
	npm version ${TYPE}
	npm publish
	git push
	git push --tags

version-patch: TYPE = patch
version-patch: .version

version-minor: TYPE = minor
version-minor: .version

version-major: TYPE = major
version-major: .version

git-clean:
	test ! -n "$$(git status --porcelain)"

