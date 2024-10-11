connect:e2e

TESTS_PATTERN="init authorizeCoinjoin cancelCoinjoinAuthorization passphrase unlockPath setBusy override checkFirmwareAuthenticity cancel.test" TESTS_FIRMWARE="2-latest"

TESTS_PATTERN="override" TESTS_FIRMWARE="2.8.1" CHROME_BIN="/snap/bin/chromium" KARMA_SINGLE_RUN=false suite connect test:e2e:web

/snap/bin/chromium --enable-automation --no-default-browser-check --no-first-run --disable-default-apps --disable-popup-blocking --disable-translate --disable-background-timer-throttling --disable-renderer-backgrounding --disable-device-discovery-notifications --no-sandbox http://localhost:8099/debug.html --disable-gpu --disable-dev-shm-usage --remote-debugging-port=9222 --user-data-dir=/tmp/karma-6398645000

-   [+] authenticateDevice.test.ts
-   [-] cancel.test.ts
-   checkFirmwareAuthenticity.test.ts
-   methods.test.ts
-   [+] passphrase.test.ts
-   thpPairing.test.ts
-   [-] authorizeCoinjoin.test.ts
-   [+] cancelCoinjoinAuthorization.test.ts
-   [-] keepSession.test.ts
-   override.test.ts
-   [+] setBusy.test.ts
-   [-] unlockPath.test.ts

[+] applyFlags.ts
[-] (loop) applySettings.ts

-   [ ] 1224 Sep 9 16:27 binanceGetAddress.ts
-   [ ] 848 Nov 14 2023 binanceGetPublicKey.ts
-   [ ] 3923 Sep 9 16:27 binanceSignTransaction.ts
-   [ ] 19880 Sep 9 16:27 cardanoGetAddress.ts
-   [ ] 1182 Sep 9 16:27 cardanoGetAddressDerivations.ts
-   [ ] 12560 Sep 9 16:27 cardanoGetNativeScriptHash.ts
-   [ ] 2116 Sep 9 16:27 cardanoGetPublicKey.ts
-   [ ] 139222 Sep 9 16:27 cardanoSignTransaction.ts
-   [ ] 386 Sep 9 16:27 changeLanguage.ts
-   [ ] 15452 Nov 14 2023 composeTransaction.ts
-   [ ] 2186 Sep 9 16:27 eosGetPublicKey.ts
-   [ ] 36207 Sep 9 16:27 eosSignTransaction.ts
-   [ ] 1863 Nov 14 2023 ethereumGetAddress.ts
-   [ ] 723 Nov 14 2023 ethereumGetPublicKey.ts
-   [ ] 1652 Sep 9 16:27 ethereumSignMessage.ts
-   [ ] 4330 Nov 14 2023 ethereumSignTransaction.ts
-   [ ] 2907 Sep 9 16:27 ethereumSignTransactionEip155.ts
-   [ ] 2061 Sep 9 16:27 ethereumSignTransactionEip1559.ts
-   [ ] 2436 Nov 14 2023 ethereumSignTypedData.ts
-   [ ] 664 Nov 14 2023 ethereumVerifyMessage.ts
-   [ ] 2184 Nov 14 2023 getAccountDescriptor.ts
-   [ ] 5571 Nov 14 2023 getAccountInfo.ts
-   [ ] 4440 Nov 14 2023 getAddress.ts
-   [ ] 1849 Nov 14 2023 getAddressMultisig.ts
-   [ ] 1367 Nov 14 2023 getAddressSegwit.ts
-   [ ] 8205 Sep 9 16:27 getFeatures.ts
-   [ ] 714 Nov 14 2023 getFirmwareHash.ts
-   [ ] 2237 Nov 14 2023 getOwnershipId.ts
-   [ ] 5010 Nov 14 2023 getOwnershipProof.ts
-   [ ] 3155 Nov 14 2023 getPublicKey.ts
-   [ ] 1563 Nov 14 2023 getPublicKeyBip48.ts
-   [ ] 7125 Sep 9 16:27 index.ts
-   [ ] 787 Nov 14 2023 nemGetAddress.ts
-   [ ] 8586 Nov 14 2023 nemSignTransactionMosaic.ts
-   [ ] 8431 Nov 14 2023 nemSignTransactionMultisig.ts
-   [ ] 2398 Nov 14 2023 nemSignTransactionOthers.ts
-   [ ] 9726 Nov 14 2023 nemSignTransactionTransfer.ts
-   [ ] 425 Nov 14 2023 resetDevice.ts
-   [ ] 1317 Sep 9 16:27 rippleGetAddress.ts
-   [ ] 4210 Sep 9 16:27 rippleSignTransaction.ts
-   [ ] 10160 Sep 9 16:27 signMessage.ts
-   [ ] 21369 Sep 9 16:27 signTransaction.ts
-   [ ] 5658 Sep 9 16:27 signTransactionBcash.ts
-   [ ] 7587 Sep 9 16:27 signTransactionBech32.ts
-   [ ] 10392 Sep 9 16:27 signTransactionBgold.ts
-   [ ] 5028 Sep 9 16:27 signTransactionDash.ts
-   [ ] 16941 Oct 1 11:36 signTransactionDecred.ts
-   [ ] 2170 Sep 9 16:27 signTransactionDoge.ts
-   [ ] 24602 Sep 9 16:27 signTransactionExternal.ts
-   [ ] 3455 Sep 9 16:27 signTransactionKomodo.ts
-   [ ] 18160 Sep 9 16:27 signTransactionMultisig.ts
-   [ ] 9132 Sep 9 16:27 signTransactionMultisigChange.ts
-   [ ] 2968 Sep 9 16:27 signTransactionPaymentRequest.ts
-   [ ] 2779 Sep 9 16:27 signTransactionPeercoin.ts
-   [ ] 21927 Sep 9 16:27 signTransactionReplace.ts
-   [ ] 6162 Sep 9 16:27 signTransactionSegwit.ts
-   [ ] 8721 Sep 9 16:27 signTransactionTaproot.ts
-   [ ] 21814 Sep 9 16:27 signTransactionZcash.ts
-   [ ] 1157 Nov 30 2023 solanaGetAddress.ts
-   [ ] 1226 Nov 30 2023 solanaGetPublicKey.ts
-   [ ] 2440 Nov 30 2023 solanaSignTransaction.ts
-   [ ] 1120 Nov 14 2023 stellarGetAddress.ts
-   [ ] 10015 Oct 1 11:36 stellarSignTransaction.ts
-   [ ] 1255 Sep 9 16:27 tezosGetAddress.ts
-   [ ] 1297 Sep 9 16:27 tezosGetPublicKey.ts
-   [ ] 7020 Sep 9 16:27 tezosSignTransaction.ts
-   [ ] 5625 Nov 14 2023 verifyMessage.ts
-   [ ] 3054 Nov 14 2023 verifyMessageSegwit.ts
-   [ ] 3093 Nov 14 2023 verifyMessageSegwitNative.ts
-   [ ] 282 Nov 14 2023 wipeDevice.ts
