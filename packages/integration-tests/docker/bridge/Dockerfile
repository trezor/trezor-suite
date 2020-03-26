FROM golang:1.11.2

RUN apt-get update
RUN apt-get install -y redir
COPY ./packages/integration-tests/bin/trezord-go ./trezord-go
EXPOSE 11325