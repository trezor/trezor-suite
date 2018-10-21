build:
	sh ./scripts/docker-build.sh

sync-%:
	sh ./scripts/s3sync.sh $*