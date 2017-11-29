check: node_modules
	`npm bin`/flow check src/
	cd src/; eslint .

git-ancestor:
	git fetch origin
	git merge-base --is-ancestor origin/master master

node_modules:
	npm install

build-node: node_modules
	rm -rf lib
	cp -r src/ lib
	find lib/ -type f ! -name '*.js' | xargs -I {} rm {}
	find lib/ -name '*.js' | xargs -I {} mv {} {}.flow
	`npm bin`/babel src --out-dir lib
	rm -r lib/flow-test
	rm lib/index-browser.js
	rm lib/index-browser.js.flow
	rm lib/index-browser-extension.js
	rm lib/index-browser-extension.js.flow

build-browser: node_modules
	rm -rf lib
	cp -r src/ lib
	find lib/ -type f ! -name '*.js' | xargs -I {} rm {}
	find lib/ -name '*.js' | xargs -I {} mv {} {}.flow
	`npm bin`/babel src --out-dir lib
	rm -r lib/flow-test
	rm lib/lowlevel/node-hid.js
	rm lib/lowlevel/node-hid.js.flow
	rm lib/index-node.js
	rm lib/index-node.js.flow
	rm lib/index-browser-extension.js
	rm lib/index-browser-extension.js.flow

build-browser-extension: node_modules
	rm -rf lib
	cp -r src/ lib
	find lib/ -type f ! -name '*.js' | xargs -I {} rm {}
	find lib/ -name '*.js' | xargs -I {} mv {} {}.flow
	`npm bin`/babel src --out-dir lib
	rm -r lib/flow-test
	rm lib/index-node.js
	rm lib/index-node.js.flow
	rm lib/index-browser.js
	rm lib/index-browser.js.flow

.move-in-%:
	mv README.md README.old.md
	mv README-$*.md README.md
	mv package-$*.json package.json

.cleanup-%:
	mv README.md README-$*.md 
	mv README.old.md README.md
	mv package.json package-$*.json 
	rm -rf lib
	git checkout src/

.version-%: .move-in-%
	npm install
	make build-$* || ( make .cleanup-$* && false )
	`npm bin`/bump patch || ( make .cleanup-$* && false )
	make build-$* || ( make .cleanup-$* && false )
	rm -r src
	npm publish || ( make .cleanup-$* && false )
	make .cleanup-$*

versions: git-clean git-ancestor check .version-node .version-browser .version-browser-extension
	rm -rf lib
	git add package*.json
	mv package-node.json package.json
	git commit -m `npm view . version`
	git tag v`npm view . version`
	mv package.json package-node.json
	git push
	git push --tags

git-clean:
	test ! -n "$$(git status --porcelain)"

