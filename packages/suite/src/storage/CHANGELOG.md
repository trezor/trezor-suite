# Storage changelog

## 30

-   added the `bitcoinAmountUnit` field to `walletSettings`

## 29

-   split to `token` property for storing OAuth tokens into `tokens.accessToken` and `tokens.refreshToken`
-   added `firmware`

## 28

-   with advent of connect v9, device.state field has changed. migrated all affected data.

## 27

-   removed walletSettings.backends
-   added wallet.blockchain[coin].backends
-   backend address remembering is now supported

## 26

-   added VTC bech32 accounts

## 25

-   added walletSettings.backends
-   removed walletSettings.blockbookUrls

## 24

-   added form drafts

## 23

-   added message system

## 22

-   added LTC bech32 accounts

## 21

-   fix tx.amount for btc sent txs (subtract tx.fee from it), add tx.totalSpent field

## 20

-   format tx.details

## 19

-   removed keyPath from fiatRates definition

## 18

-   added device.walletNumber

## 17

-   added coinmarketTrades

## 16

-   removed sendForm
-   added sendFormDrafts

## 15

-   added metadata object store
-   added device.metadata
-   added account.metadata
