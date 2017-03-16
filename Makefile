BIN=`npm bin`

LIB=lib/index.js
LIB_TARGET=dist/index.js

TEST=test/*.js

EXAMPLE=example/index.js
EXAMPLE_TARGET=dist/example.js
SOCKET_WORKER=lib/socket-worker.js
SOCKET_TARGET=dist/socket-worker.js

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
	${BIN}/browserify ${EXAMPLE} -g [ uglifyify ] -d \
		| ${BIN}/exorcist ${EXAMPLE_TARGET}.map > ${EXAMPLE_TARGET}
	${BIN}/browserify ${SOCKET_WORKER} -g [ uglifyify ] -d \
		| ${BIN}/exorcist ${SOCKET_WORKER}.map > ${SOCKET_TARGET}

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
