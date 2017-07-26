FROM ubuntu:trusty
RUN apt-get  update
RUN apt-get install -y git
RUN apt-get install -y wget
RUN wget -qO- https://deb.nodesource.com/setup_4.x | sudo bash -
RUN sudo apt-get install -y nodejs
RUN apt-get install -y gdebi
RUN wget -O bitcore.deb 'https://www.dropbox.com/s/txkzsa1m2a7mp64/bitcore.deb?dl=1'
RUN gdebi -n bitcore.deb

ENV NVM_DIR /root/.nvm
ENV NVM_NODE_DIR /root/.nvm/node
ENV NODE_VERSION 8.2.1

RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# Install nvm with node and npm
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash \
    && source $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

ENV NODE_PATH $NVM_NODE_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_NODE_DIR/v$NODE_VERSION/bin:$PATH

RUN sudo npm install -g yarn

ADD do.sh do.sh
