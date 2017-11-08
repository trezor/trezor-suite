BIN=`npm bin`

LIB=src/index.js
LIB_TARGET=dist/index.js

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
		${LIB_TARGET} ${LIB_TARGET}.map \
		${EXAMPLE_TARGET} ${EXAMPLE_TARGET}.map

node_modules:
	npm install
