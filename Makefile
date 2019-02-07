build-npm:
	rm -rf ./npm
	yarn run build:npm
	# cp -a ./src/images ./npm/lib/images
