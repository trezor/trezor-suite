# Notes on docker dev environment

Here we gather some implementation notes so that we don't forget when trying to rewrite this in the future.

### FAQ

> What is the value of maintaining this docker infrastructure?

It is meant to be an easy way how to quickly spin up trezor suite dev environment in somewhat isolated environment.
It is not meant to be daily driver for full time contributors. Rather it is meant to be a tool to make life 
easier to first-time contributors and for people who want to test something but cannot afford to configure all the tools 
on their host machine.

Secondarily, it could act as a working example to help new developers to set up their host machine similarly. 
The churn is high. Docs might be incomplete or outdated. Alternatively it could help describe repro steps in some 
failure cases. It could also help when doing quick ad-hoc tests with different tools/node versions.

I personally use this to run tests on a secondary beefy machine which has only docker installed.
This way I don't need/want to maintain the dev setup on the machine itself and whole solution is portable.
By the way, I use the machine for many dockerized dev tasks.

> Why docker and docker-compose?

Familiar to most.

> Why Mutagen?

[Mutagen](https://mutagen.io) is a new unproven tool, but it has a great promise.  

The problem: We aim to support linux, macOS and windows dev scenarios. The docker container needs to receive file edits
as one continues to develop the app. One solution could be to share source files on a docker volume between the host 
machine and the container. That would be straightforward but unfortunately it has a [tricky problem with permissions](https://dille.name/blog/2018/07/16/handling-file-permissions-when-writing-to-volumes-from-docker-containers/) 
between a host machine(?), and the docker container (linux) - docker does not attempt to remap UID/GID when writing to 
volumes. In linux-linux scenario with careful handling of UID/GID we can manage. Unfortunately the situation is more 
hairy with macOS-linux and windows-linux.

An alternative idea is to not use docker volumes but sync files by some other means. Mutagen looks like a tool made 
exactly for this task. It has also good configurability to [handle permissions](https://mutagen.io/documentation/synchronization/permissions).
This way we side step the problem with permissions because files are not shared but synced instead.

> Why not network:host?

Our docker dev environment uses multiple docker containers (aka docker compose services). 
It would be convenient to use host network in all containers so all service ports are shared between them and with 
the host machine. This works well in linux-linux scenarios but not so well under macOS due to technical implementation 
of docker as a light-weight linux virtual machine under macOS.

We decided to run docker compose on a separate network (the default) and not expose ports with the docker. Instead,
we use Mutagen to do [network forwarding](https://mutagen.io/documentation/forwarding) to the host machine where all 
the dev action should normally happen. This should offer somewhat leveled paying field between various platforms
and at the end of the day offers better isolation of the docker environment. E.g. for scenarios where you develop
on host platform directly and sometimes use the docker infrastructure to test some things out.
