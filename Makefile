# Run docker build
# usage: 
# make build-beta
# make build-stable
build-%:
	./scripts/docker-build.sh $*

# s3sync with stage.mytrezor.com
# Upload requested build for testing purposes
# usage:
# make stage-beta
# make stage-stable
stage-%:
	./scripts/s3sync.sh stage $*

# s3sync with beta.mytrezor.com
# Upload build/beta only
# usage:
# make beta
beta:
	./scripts/s3sync.sh beta beta

# s3sync with wallet.mytrezor.com
# Upload build/stable only
# usage:
# make stable
stable:
	./scripts/s3sync.sh stable stable