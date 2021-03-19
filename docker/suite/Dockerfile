# For suite-dev, the idea behind docker is that we install, build and run dev server for user without any
# dependencies on host (yarn, node). But all source files remain on host. We must ensure that permissions 
# of newly created files in docker (entire monorepo is mounted volume) match users default.
# Otherwise user would run into permission denied problem when trying to rebuild project outside docker.

FROM node:14
  
RUN apt-get update && apt-get -y --no-install-recommends install \
    ca-certificates \
    curl

RUN curl -o /usr/local/bin/gosu -SL "https://github.com/tianon/gosu/releases/download/1.4/gosu-$(dpkg --print-architecture)" \
    && curl -o /usr/local/bin/gosu.asc -SL "https://github.com/tianon/gosu/releases/download/1.4/gosu-$(dpkg --print-architecture).asc" \
    && chmod +x /usr/local/bin/gosu

COPY ./suite/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]