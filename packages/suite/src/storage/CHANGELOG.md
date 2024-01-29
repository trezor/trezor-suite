# Storage changelog

## 43

-   fixes bug cannot set properties of undefined (setting 'passwords') introduced by migration 41

## 42

-   remove fiatRates table

## 41

-   adds `metadata.selectedProvider.passwords` key

## 40

-   `device.metadata.status` does not exist anymore. this information is derivable from `device.metadata[key]` and `metadata.error[deviceState]`

## 39

-   `metadata.provider` replaced with array of `metadata.providers`
-   `metadata.selectedProvider` field added to select from `metadata.providers`
-   labeling data are no longer stored with labelable entities (devices, accounts) but are to be found under `metadata.providers[].data`
-   labeling data (that were previously stored withing accounts/devices object) are not migrated
    but since data are fetched from providers (which are migrated) it should affect only users that update their suite and use it offline at the same time

## 38

-   add internal model to saved devices

## 37

-   remove persisted coinjoin sessions

## 36

-   token `address` to `contract`
-   remove ropsten accounts, txs and settings

## 35

-   saved ethereum network type txs are removed to be fetched again and obtain internal transfers and token transfer contract and standard

## 34

-   added `coinjoinDebugSettings`

## 33

-   added `messageSystem.dismissedMessages[id].feature`

## 32

-   added `coinjoinAccounts`

## 31

-   txs are now stored unconverted (mostly `sat` units instead of `BTC`), therefore migration was needed
-   added `firmwareType` field to objects in`devices`

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
