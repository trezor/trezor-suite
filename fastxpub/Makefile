CRYPTODIR = trezor-crypto

EMFLAGS = \
	-Oz \
	--closure 1 \
	--pre-js pre.js \
	--post-js post.js \
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
SRC += rand-mock.c

all: fastxpub.js benchmark-browserify.js

fastxpub.js: $(SRC)
	emcc $(EMFLAGS) -o $@ $^

benchmark-browserify.js: node_modules fastxpub.js benchmark.js
	$(shell npm bin)/browserify benchmark.js -o $@ --noparse=fastxpub.js

node_modules:
	npm install
	npm install browserify

benchmark: node_modules fastxpub.js benchmark.js
	node benchmark.js

test: node_modules fastxpub.js
	node test.js

clean:
	rm -f fastxpub.js fastxpub.wasm benchmark-browserify.js

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
