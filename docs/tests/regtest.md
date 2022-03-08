# Regtest

Regtest is a private blockchain which has the same rules and address format as testnet, but there is no global p2p network to connect to.

To use custom backend (electrum server) with bitcoind running in regtest mode you can use the docker container by running the command below:

```bash
bash docker/docker-regtest-electrum.sh
```

The previous command will initialize a new fresh regtest bitcoin blockchain with electrum server running and expose to the localhost at TCP port 50001.

In order to be able to use regtest electrum in suite it is required to configured the REGTEST coin with custom backend with URL below:

```
localhost:50001:t
```
