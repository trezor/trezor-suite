## How to build & push image to GitLab registry

`docker login` (your gitlab credentials)

`docker build -t registry.gitlab.com/satoshilabs/trezor/trezor-suite .`

`docker push registry.gitlab.com/satoshilabs/trezor/trezor-suite`
