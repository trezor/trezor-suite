# Regtest

Regtest is a private blockchain which has the same rules and address format as testnet, but there is no global p2p network to connect to.

To use custom backend (electrum server) with bitcoind running in regtest mode you can use the docker container that is part of our trezor-user-env.

In order to be able to use regtest electrum in suite it is required to configured the REGTEST coin with custom backend with URL below:

```
localhost:50001:t
```
