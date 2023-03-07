echo "Starting..."

echo "Building connect"
yarn workspace @trezor/connect build:lib

echo "Buiding popup"
yarn workspace @trezor/connect-popup build

echo "Building in line"

yarn workspace @trezor/connect-web build:inline

echo "Copying to extension"
cp packages/connect-web/build/trezor-connect.js packages/connect-examples/webextension-mv3/vendor/

echo "Done"
echo "Running connect web"
yarn workspace @trezor/connect-web dev