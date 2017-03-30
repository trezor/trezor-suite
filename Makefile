BIN=`npm bin`

LIB=lib/index.js
LIB_TARGET=dist/index.js

TEST=test/*.js

EXAMPLE=example/index.js
EXAMPLE_TARGET=gh-pages/example.js
SOCKET_WORKER=lib/socketio-worker/inside.js
DISCOVERY_WORKER=lib/discovery/worker/inside/index.js
SOCKET_TARGET=gh-pages/socket-worker.js
DISCOVERY_TARGET=gh-pages/discovery-worker.js

.PHONY: all check lib test example watch server clean

all: lib

check: node_modules
	flow check lib/
	cd lib && eslint .

lib: node_modules
	${BIN}/browserify ${LIB} -g [ uglifyify ] -d \
		| ${BIN}/exorcist ${LIB_TARGET}.map > ${LIB_TARGET}

test: node_modules
	${BIN}/browserify ${TEST} | node

example: node_modules
	${BIN}/browserify ${EXAMPLE} -g [ uglifyify ] -d > ${EXAMPLE_TARGET}
	${BIN}/browserify ${SOCKET_WORKER} -g [ uglifyify ] -d > ${SOCKET_TARGET}
	${BIN}/browserify ${DISCOVERY_WORKER} -g [ uglifyify ] -d  > ${DISCOVERY_TARGET}
	cp lib/trezor-crypto/emscripten/trezor-crypto.js gh-pages

watch: node_modules
	${BIN}/watchify ${EXAMPLE} -o ${EXAMPLE_TARGET} -d -v

server:
	@echo ready at http://localhost:8080/dist/example.html
	python -m SimpleHTTPServer 8080

clean:
	rm -f \
		${LIB_TARGET} ${LIB_TARGET}.map \
		${EXAMPLE_TARGET} ${EXAMPLE_TARGET}.map

node_modules:
	npm install
