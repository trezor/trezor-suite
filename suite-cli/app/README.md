# @suite-cli/app

Suite's Node CLI entry point. Its composition root wires the existing crypto and vault
icon-download services.

```sh
yarn suite:cli --help
yarn suite:cli download-crypto-icons
yarn suite:cli download-vault-icons
```

`download-crypto-icons` includes vault icons. Both commands write to
`suite-common/icons/files/cryptoIcons`.
