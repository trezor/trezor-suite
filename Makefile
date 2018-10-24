build-%:
	./scripts/docker-build.sh $*

sync-%:
	./scripts/s3sync.sh $*