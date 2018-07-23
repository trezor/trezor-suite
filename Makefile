BIN=`npm bin`

LIB=src/index.js

TEST=test/*.js

EXAMPLE=example/index.js
EXAMPLE_TARGET=gh-pages/example.js
SOCKET_WORKER=src/socketio-worker/inside.js
DISCOVERY_WORKER=src/discovery/worker/inside/index.js
SOCKET_TARGET=gh-pages/socket-worker.js
DISCOVERY_TARGET=gh-pages/discovery-worker.js

.PHONY: all check lib test example watch server clean

all: lib

example: node_modules
	${BIN}/browserify ${EXAMPLE} -g [ uglifyify ] -d > ${EXAMPLE_TARGET}
	${BIN}/browserify ${SOCKET_WORKER} -g [ uglifyify ] -d > ${SOCKET_TARGET}
	${BIN}/browserify ${DISCOVERY_WORKER} -g [ uglifyify ] -d  > ${DISCOVERY_TARGET}
	cp fastxpub/build/fastxpub.js gh-pages
	cp fastxpub/build/fastxpub.wasm gh-pages

clean:
	rm -f \
		${EXAMPLE_TARGET} ${EXAMPLE_TARGET}.map
	rm -rf lib

node_modules:
	yarn

lib:
	`npm bin`/babel src --out-dir lib
	cp -r ./fastxpub/build ./lib/fastxpub
	cd ./src && find . -name '*.js' | xargs -I {} cp {} ../lib/{}.flow

unit:
	`npm bin`/mocha --compilers js:babel-register

unit-build-tx:
	`npm bin`/mocha --compilers js:babel-register test/build-tx.js

unit-discovery:
	`npm bin`/mocha --compilers js:babel-register test/discover-account.js

coverage:
	`npm bin`/nyc --check-coverage mocha --compilers js:babel-register 

test-bitcore:
	`npm bin`/mocha --compilers js:babel-register test_bitcore/bitcore.js

flow:
	`npm bin`/flow check src

eslint:
	cd src && `npm bin`/eslint .
	cd ./test && `npm bin`/eslint .
	cd ./example && `npm bin`/eslint .

karma-firefox:
	`npm bin`/karma start --browsers Firefox --single-run

karma-chrome:
	`npm bin`/karma start --browsers Chrome --single-run

git-ancestor:
	git fetch origin
	git merge-base --is-ancestor origin/master master

.version: clean git-clean git-ancestor flow eslint lib
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


