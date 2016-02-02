BIN=`npm bin`
TEST=test/index.js
TARGET=dist/index.js

.PHONY: all check build watch clean server

all: build

check: node_modules
	flow lib/
	eslint lib/*.js

build: node_modules
	${BIN}/browserify ${TEST} -g [ uglifyify ] -d \
		| ${BIN}/exorcist ${TARGET}.map > ${TARGET}

watch: node_modules
	${BIN}/watchify ${TEST} -o ${TARGET} -v

clean:
	rm -f ${TARGET} ${TARGET}.map

server:
	@echo ready at http://localhost:8000/dist/index.html
	python -m SimpleHTTPServer 8000

node_modules:
	npm install
