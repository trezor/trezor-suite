FROM node:12

ARG SUPPORTED_SHELLS

RUN apt-get update && apt-get -y --no-install-recommends install \
    ca-certificates \
    curl \
    sudo \
    $SUPPORTED_SHELLS \
    # https://github.com/Automattic/node-canvas#compiling
    build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

ARG UID
ARG GID

ENV BUILDTIME_UID $UID
ENV BUILDTIME_GID $GID

# we don't want to pollute output of `docker ps` and similar, so we chose minimal path as our entrypoint
COPY ./_shared/entrypoint.sh /x
RUN chmod +x /x
ENTRYPOINT ["/x"]

# add our user and allow him sudo without password (for rare occassions)
RUN groupadd --gid "$GID" user && \
    useradd --shell /bin/bash --uid "$UID" --gid "$GID" --create-home user
RUN usermod -aG sudo user && echo "user ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers
ENV HOME /home/user

# copy some useful scripts for management
COPY ./suite-dev/home/user /home/user
RUN chmod +x /home/user/bin/*.sh
RUN chown -R user:user /home/user

# extend PATH for convenience
ENV PATH /home/user/bin:$PATH
