## How to build & push image to GitLab registry

`docker login registry.gitlab.com/satoshilabs/trezor-suite`

`docker build -t registry.gitlab.com/satoshilabs/trezor/trezor-suite/base .`

`docker push registry.gitlab.com/satoshilabs/trezor/trezor-suite/base`
