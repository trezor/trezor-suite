#!/bin/sh

echo "preparing suite dev server"

# folder /suite in the container is mounted from host. but we do not want to make any changes to it
# from inside container. it should remaion read only. that's why we need to copy its content to another
# folder where we may build libs and generate dev build.  
rsync -arv --exclude='*/' . ../suite-copy
rsync -arv .git ../suite-copy

# todo: we possibly don't need to copy all packages
rsync -arv --exclude 'node_modules/' ./packages/* ../suite-copy/packages

cd ../suite-copy
yarn
# todo: build libs conditionaly only if they changed
yarn build:libs
yarn suite:dev
