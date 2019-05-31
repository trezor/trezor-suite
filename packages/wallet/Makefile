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
sync-stage-%:
	./scripts/s3sync.sh stage $*

# s3sync with beta.mytrezor.com
# Upload build/beta only
# usage:
# make beta
sync-beta:
	./scripts/s3sync.sh beta beta

# s3sync with wallet.mytrezor.com
# Upload build/stable only
# usage:
# make stable
sync-stable:
	./scripts/s3sync.sh stable stable

.DEFAULT_GOAL:= default
default:
	@echo "Build:"
	@echo "git checkout to desired branch (beta|stable)"
	@echo "    make build-beta"
	@echo "    make build-stable"
	@echo "Sync:"
	@echo "s3 sync desired build to server (beta.mytrezor.com|wallet.mytrezor.com)"
	@echo "    make sync-beta"
	@echo "    make sync-stable"
	@echo "Staging:"
	@echo "s3 sync desired build to stage server (stage.mytrezor.com)"
	@echo "    make sync-stage-beta"
	@echo "    make sync-stage-stable"