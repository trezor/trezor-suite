BIN=`npm bin`
SRC=lib/index.js
TARGET=dist/index.js
TEST=test/*.js

TRANSFORMS=--presets [ es2015 stage-0 react ]

.PHONY: all build watch test clean

all: build

check: ${SRC} node_modules
	flow lib/

build: ${SRC} node_modules
	${BIN}/browserify ${SRC} \
		-t [ babelify ${TRANSFORMS} --sourceMapRelative . ] \
		-g [ uglifyify ] \
		-d \
	| ${BIN}/exorcist ${TARGET}.map > ${TARGET}

watch: ${SRC} node_modules
	${BIN}/watchify ${SRC} \
		-t [ babelify ${TRANSFORMS} ] \
		-o ${TARGET} \
		-v

clean:
	rm -f ${TARGET} ${TARGET}.map

server:
	@echo starting server, open http://localhost:8000/dist/index.html in browser.
	python -m SimpleHTTPServer 8000

node_modules:
	npm install
