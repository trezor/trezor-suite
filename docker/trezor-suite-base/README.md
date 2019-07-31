## How to build & push image to GitLab registry

`docker login registry.corp.sldev.cz` (your gitlab credentials)

`docker build -t registry.corp.sldev.cz/trezor/trezor-suite/base .`

`docker push registry.corp.sldev.cz/trezor/trezor-suite/base`
