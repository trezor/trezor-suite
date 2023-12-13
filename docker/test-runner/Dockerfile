## Use a proxy or fallback to no proxy at all (direct access to Docker Hub).
ARG CI_DOCKER_PROXY=""
FROM ${CI_DOCKER_PROXY}cypress/included:13.6.1

RUN apt-get update && apt-get -y --no-install-recommends install \
    ca-certificates \
    curl

RUN curl -o /usr/local/bin/gosu -SL "https://github.com/tianon/gosu/releases/download/1.12/gosu-$(dpkg --print-architecture)" \
    && curl -o /usr/local/bin/gosu.asc -SL "https://github.com/tianon/gosu/releases/download/1.12/gosu-$(dpkg --print-architecture).asc" \
    && chmod +x /usr/local/bin/gosu

COPY ./suite/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
