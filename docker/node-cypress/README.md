## How to build & push image to GitLab registry

`docker login` (your gitlab credentials)
`docker build -t registry.corp.sldev.cz/trezor/trezor-suite .`
`docker push registry.corp.sldev.cz/trezor/trezor-suite`
