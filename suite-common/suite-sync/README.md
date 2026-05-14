## Suite Sync

This is the big package with most of the Suite Sync code. Here all the other Suite Sync packages meet.
Except for `@suite-common/suite-sync-evolu`. Evolu MUST NOT be imported here directly.

responsibilities:

- Containing state of the Suite Sync feature itself (flags, relay URL, ...) ⇒ `suiteSyncReducer.ts`
- Providing implementation for ensuring keys are available for a device. ⇒ `createEnsureSuiteSyncKeys.ts`
- Subscribing & unsubscribing from Storages (abstracted Evolu Instances) ⇒ `storage`
- Keeping mirror of all Evolu data in Redux ⇒ `data`
- Making sure Suite Sync Owner and its Secrets are properly encrypted ⇒ `owner`
- Integration with Quota Manager packages to make sure user registered device and allowance or theirs data.
