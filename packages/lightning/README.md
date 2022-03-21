## Trezor Lightning

Library for all the lightning network related utilities for Trezor Suite.

## Questions/findings regarding LN submarine swaps integrations in Trezor suite.

1. What data we need to store for an already made swap?
    - Bolt11 invoice
    - refund address or path to it (if the payment gets in the blockchain it will be there with tx id)
2. Where do we store the data?
    - Storage
    - We could leverage Trezor swap service for storing this data so by request suite could always retrieve all the detail information about the swap.
3. What happens if someone does not store data or restore wallet?
    - We should be able to recognise that this TX was a swap in the blockchain
    - We cannot recover the invoice unless we store it in Trezor swap service as well
    - It would be more clear in general
    - If the swap tx can be included with more outputs it makes it more difficult to display in UI
    * It wouldn't allow to send more outputs with the same tx
4. Refund address
    - In the POC is taken from the same account, next unused index
    - Should we use other path?
5. How can we verify the invoice was paid?
    - Suite could ask when discovery to Trezor swap service for the preimage of the invoice, then if Trezor swap service replies with the correct preimage we are sure the invoice was paid.

## TODOs in order to have a fully working POC

Next step should continue with the POC doing required changes in connect and suite to use the current draft firmware implementation of `PAYTOLNSWAP` transaction output.

-   [ ] Implement (PAYTOLNSWAP)[https://github.com/trezor/trezor-firmware/pull/2136] transaction output in connect
-   [ ] Once implemented in connect, use `PAYTOLNSWAP` output in suite to complete the swap

## Doubts

-   how to run tests in connect with a branch from a draft PR https://github.com/trezor/trezor-firmware/pull/2136/files
    -   I Probably have to run trezor-user-env
    -   I need to use docker docker/docker-connect-test.sh with flag not to run in order to use trezor-user-env
-
