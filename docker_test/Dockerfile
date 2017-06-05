FROM ubuntu:trusty
RUN apt-get update
RUN apt-get install -y git
RUN apt-get install -y wget
RUN wget -qO- https://deb.nodesource.com/setup_4.x | sudo bash -
RUN sudo apt-get install -y nodejs
RUN sudo npm install -g yarn
RUN apt-get install -y gdebi
RUN wget -O bitcore.deb 'https://www.dropbox.com/s/txkzsa1m2a7mp64/bitcore.deb?dl=1'
RUN gdebi -n bitcore.deb

ADD do.sh do.sh
