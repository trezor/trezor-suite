CRYPTODIR = trezor-crypto

EMFLAGS = \
	-Oz \
	--closure 1 \
	--pre-js additional_sources/pre.js \
	--post-js additional_sources/post.js \
	-I $(CRYPTODIR)/ed25519-donna \
	-s EXPORTED_FUNCTIONS='["_hdnode_public_ckd_address_optimized", "_ecdsa_read_pubkey"]' \
	-s NO_EXIT_RUNTIME=1 \
	-s NO_FILESYSTEM=1 \
	-s WASM=1

SRC += $(CRYPTODIR)/bignum.c
SRC += $(CRYPTODIR)/ecdsa.c
SRC += $(CRYPTODIR)/secp256k1.c
SRC += $(CRYPTODIR)/hmac.c
SRC += $(CRYPTODIR)/bip32.c
SRC += $(CRYPTODIR)/base58.c
SRC += $(CRYPTODIR)/ripemd160.c
SRC += $(CRYPTODIR)/sha2.c
SRC += $(CRYPTODIR)/address.c
SRC += additional_sources/rand-mock.c

all: build/fastxpub.js tests/benchmark-browserify.js

build/fastxpub.js: $(SRC)
	emcc $(EMFLAGS) -o $@ $^

tests/benchmark-browserify.js: node_modules build/fastxpub.js tests/benchmark.js
	$(shell npm bin)/browserify tests/benchmark.js -o $@ --noparse=`pwd`/build/fastxpub.js

node_modules:
	npm install
	npm install browserify

benchmark: node_modules build/fastxpub.js tests/benchmark.js
	cd tests && node benchmark.js

test: node_modules build/fastxpub.js
	cd tests && node test.js

clean:
	rm -f build/fastxpub.js build/fastxpub.wasm tests/benchmark-browserify.js

.docker:
	docker pull apiaryio/emcc

docker-shell: .docker
	docker run --rm -i -v $(shell pwd)/..:/src -t apiaryio/emcc /bin/bash

docker-build: .docker
	docker run --rm -v $(shell pwd)/..:/src apiaryio/emcc /bin/bash -c 'cd fastxpub && make'

docker-benchmark: .docker
	docker run --rm -v $(shell pwd)/..:/src apiaryio/emcc /bin/bash -c 'cd fastxpub && make benchmark'

docker-test: .docker
	docker run --rm -v $(shell pwd)/..:/src apiaryio/emcc /bin/bash -c 'cd fastxpub && make test'
