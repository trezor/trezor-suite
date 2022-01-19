# How to upgrade node version?

If you want to upgrade NodeJS version, you need to update it in two places:

1. `.nvmrc` - simply change version in this file
2. `docker/ci-base/Dockerfile` - find env variable `NODE_VERSION` and bump it here, then don't forget to rebuild Docker image

One more note: Please make sure that version you want to use is also updated and used in Nix.
