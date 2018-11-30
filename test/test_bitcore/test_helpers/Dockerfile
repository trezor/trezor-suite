#this dockerfile installs regtest bitcore
# + starts server that runs anything you post it as sudo
#   and returns stdout back
# (it is unsafe, but it's for testing)

FROM ubuntu:trusty

ADD _node_server.js .
ADD install_nodejs4.sh .
ADD install_regtest.sh .
ADD install_node_setup_4.sh .

RUN ./install_nodejs4.sh
RUN ./install_regtest.sh
ADD start_bitcore.sh .
ADD start_server.sh .

EXPOSE 1234
EXPOSE 3005

CMD ["bash", "/start_server.sh"]
