# @suite-common/spark

Spark integration package for Trezor Suite.

Important design and product decisions:

- Keep Spark isolated in this package. Suite app code should stay as thin UI and routing glue.
- Do not add Spark as a real Connect coin or a real network in shared network definitions. Spark is exposed as a Suite-only product surface.
- Derive the Spark wallet mnemonic from the Suite Sync owner secret so the wallet follows the wallet descriptor rather than a device-specific identifier.
- Build Spark-specific send, receive, and history flows instead of reusing the legacy Suite account flows.
- Support multiple Spark accounts per wallet descriptor through Spark SDK `accountNumber`.
- Enable Spark privacy mode for every wallet during initialization. This is required by product decision and follows the Spark privacy guidance: https://docs.spark.money/wallets/privacy.
- Treat on-chain deposit as copy-address only and Lightning deposit as invoice plus QR only.
- Limit sending to Lightning invoice payments for now. Do not implement generic Spark send rails beyond the current product scope.
