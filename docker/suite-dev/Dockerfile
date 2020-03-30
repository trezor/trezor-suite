FROM node:12-buster

RUN apt-get update
RUN apt install rsync grsync -y

RUN mkdir suite-copy
WORKDIR /suite

COPY ./suite-dev/run-inside.sh /
