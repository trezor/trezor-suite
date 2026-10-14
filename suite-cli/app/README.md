# @suite-cli/app

Suite's Node CLI entry point. Its composition root assembles network modules and injects them into
the icon-download services.

```sh
yarn suite:cli --help
yarn suite:cli download-crypto-icons
```

`download-crypto-icons` includes vault icons and writes to
`suite-common/icons/files/cryptoIcons`.
