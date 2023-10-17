## Cardano: Sign transaction

Asks device to sign given transaction. User is asked to confirm all transaction
details on Trezor.

```javascript
const result = await TrezorConnect.cardanoSignTransaction(params);
```

### Params

[Optional common params](commonParams.md)

[CardanoSignTransaction type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/cardano/index.ts)

-   `signingMode` - _required_ [CardanoTxSigningMode](#CardanoTxSigningMode)
-   `inputs` - _required_ `Array` of [CardanoInput](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/cardano/index.ts)
-   `outputs` - _required_ `Array` of [CardanoOutput](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/cardano/index.ts)
-   `fee` - _required_ `String`
-   `protocolMagic` - _required_ `Integer` 764824073 for Mainnet, 1 for Preprod Testnet, 2 for Preview Testnet
-   `networkId` - _required_ `Integer` 1 for Mainnet, 0 for Testnet
-   `ttl` - _optional_ `String`
-   `validityIntervalStart` - _optional_ `String`
-   `certificates` - _optional_ `Array` of [CardanoCertificate](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/cardano/index.ts)
-   `withdrawals` - _optional_ `Array` of [CardanoWithdrawal](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/cardano/index.ts)
-   `auxiliaryData` - _optional_ [CardanoAuxiliaryData](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/cardano/index.ts)
-   `mint` - _optional_ [CardanoMint](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/cardano/index.ts)
-   `scriptDataHash` - _optional_ `String`
-   `collateralInputs` - _optional_ `Array` of [CardanoCollateralInput](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/cardano/index.ts)
-   `requiredSigners` - _optional_ `Array` of [CardanoRequiredSigner](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/cardano/index.ts)
-   `collateralReturn` - _optional_ [CardanoOutput](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/cardano/index.ts)
-   `totalCollateral` - _optional_ `String`
-   `referenceInputs` - _optional_ `Array` of [CardanoReferenceInput](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/cardano/index.ts)
-   `additionalWitnessRequests` - _optional_ `Array` of `string | Array<number>` (paths). Used for multi-sig and token minting witness requests as those can not be determined from the transaction parameters.
-   `metadata` - _removed_ - use `auxiliaryData` instead
-   `derivationType` — _optional_ `CardanoDerivationType` enum. Determines used derivation type. Default is set to ICARUS_TREZOR=2.
-   `includeNetworkId` — _optional_ `Boolean`. Determines whether `networkId` should be explicitly serialized into the transaction body. Default is `false`.
-   `chunkify` — _optional_ `boolean` determines if recipient address will be displayed in chunks of 4 characters. Default is set to `false`

### CardanoTxSigningMode

#### `ORDINARY_TRANSACTION`

Represents an ordinary user transaction transferring funds, delegating stake or withdrawing rewards. The transaction will be witnessed by keys derived from paths included in the `inputs`, `certificates` and `withdrawals`. Additionally, if token minting is present, transaction will also be witnessed by keys derived from paths included in `additionalWitnessRequests`.

The transaction

-   _should_ have valid `path` property on all `inputs`
-   _must not_ contain a pool registration certificate
-   _must not_ contain `collateralInputs`, `collateralReturn`, `totalCollateral` and `referenceInputs`
-   _must_ contain paths as stake credentials in certificates and withdrawals (no key hashes or script hashes)
-   _may_ contain only 1852 and 1855 paths
-   _must not_ contain 1855 witness requests when transaction is not minting/burning tokens

#### `POOL_REGISTRATION_AS_OWNER`

Represents pool registration from the perspective of pool owner.

The transaction

-   _must_ have `path` undefined on all `inputs` (i.e., we are not witnessing any UTxO)
-   _must_ have single Pool registration certificate
-   _must_ have single owner given by path on that certificate
-   _must not_ contain withdrawals
-   _must not_ contain token minting
-   _must not_ contain `collateralInputs`, `requiredSigners`, `collateralReturn`, `totalCollateral` and `referenceInputs`
-   _must_ contain only staking witness requests

These restrictions are in place due to a possibility of maliciously signing _another_ part of the transaction with the pool owner path as we are not displaying device-owned paths on the device screen.

#### `MULTISIG_TRANSACTION`

Represents a multi-sig transaction using native scripts. The transaction will only be signed by keys derived from paths included in `additionalWitnessRequests`.

The transaction

-   _must_ have `path` undefined on all `inputs`
-   _must not_ contain output addresses given by parameters
-   _must not_ contain a pool registration certificate
-   _must not_ contain `collateralInputs`, `collateralReturn`, `totalCollateral` and `referenceInputs`
-   _must_ contain script hash stake credentials in certificates and withdrawals (no paths or key hashes)
-   _may_ contain only 1854 and 1855 witness requests
-   _must not_ contain 1855 witness requests when transaction is not minting/burning tokens

#### `PLUTUS_TRANSACTION`

Represents a transactions containing Plutus script evaluation. The transaction will be witnessed by keys derived from paths included in the `inputs`, `certificates`, `withdrawals`, `collateralInputs`, `requiredSigners` and `additionalWitnessRequests`.

The transaction

-   _should_ contain `scriptDataHash` and `collateralInputs`
-   _must not_ contain a pool registration certificate
-   _may_ contain only 1852, 1854 and 1855 required signers
-   _may_ contain only 1852, 1854 and 1855 witness requests

Note: `requiredSigners` are meant for Plutus transactions (from the blockchain point of view), but some applications utilize them for their own purposes, so we allow them in all signing modes (except for pool registration as owner).

### Stake pool registration certificate specifics

Trezor supports signing of stake pool registration certificates as a pool owner. The transaction may contain external inputs (e.g. belonging to the pool operator) and Trezor is not able to verify whether they are actually external or not, so if we allowed signing the transaction with a spending key, there is the risk of losing funds from an input that the user did not intend to spend from. Moreover there is the risk of inadvertedly signing a withdrawal in the transaction if there's any. To mitigate those risks, we introduced special validation rules for stake pool registration transactions which are validated on Trezor as well. The validation rules are the following:

1. The transaction must not contain any other certificates, not even another stake pool registration
1. The transaction must not contain any withdrawals
1. The transaction inputs must all be external, i.e. path must be either undefined or null
1. Exactly one owner should be passed as a staking path and the rest of owners should be passed as bech32-encoded reward addresses

### CIP-36 vote key registration (Catalyst and other)

Trezor supports signing transactions with auxiliary data containing a vote key registration. Vote key registrations used to follow [CIP-15](https://cips.cardano.org/cips/cip15/), which has been superseded by [CIP-36](https://cips.cardano.org/cips/cip36/). Currently, Trezor supports both CIP-15 and CIP-36 formats, the intended standard can be specified in the `format` field (with CIP-15 being the default). They differ in the following:

-   CIP-36 allows delegating the voting power to several vote public keys with different voting power ([CardanoCVoteRegistrationDelegation](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/cardano/index.ts)) as an alternative to providing only a single vote public key. Note that Trezor Firmware supports at most 32 delegations in a single registration.
-   CIP-36 registrations contain the [votingPurpose](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/cardano/index.ts) field. The value 0 is intended for Catalyst voting and the value 1 is intended for other purposes. If no value is provided, Trezor serializes 0 by default (if the CIP-36 format is used).

Trezor does not support the 1694 derivation paths at the moment.

The payment address to receive rewards can be provided either as a `paymentAddress` string or as a `paymentAddressParameters` object. For the smoothest user experience, we recommend providing `paymentAddressParameters` of a BASE address owned by the device.

### Transaction examples

#### Ordinary transaction

```javascript
TrezorConnect.cardanoSignTransaction({
    signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
    inputs: [
        {
            path: "m/44'/1815'/0'/0/1",
            prev_hash: '1af8fa0b754ff99253d983894e63a2b09cbb56c833ba18c3384210163f63dcfc',
            prev_index: 0,
        },
    ],
    outputs: [
        {
            address: 'Ae2tdPwUPEZCanmBz5g2GEwFqKTKpNJcGYPKfDxoNeKZ8bRHr8366kseiK2',
            amount: '3003112',
        },
        {
            addressParameters: {
                addressType: CardanoAddressType.BASE,
                path: "m/1852'/1815'/0'/0/0",
                stakingPath: "m/1852'/1815'/0'/2/0",
            },
            amount: '7120787',
        },
        {
            format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
            address:
                'addr1q84sh2j72ux0l03fxndjnhctdg7hcppsaejafsa84vh7lwgmcs5wgus8qt4atk45lvt4xfxpjtwfhdmvchdf2m3u3hlsd5tq5r',
            amount: '2000000',
            tokenBundle: [
                {
                    policyId: '95a292ffee938be03e9bae5657982a74e9014eb4960108c9e23a5b39',
                    tokenAmounts: [
                        {
                            assetNameBytes: '74652474436f696e',
                            amount: '7878754',
                        },
                    ],
                },
            ],
        },
        {
            address: 'addr1w9rhu54nz94k9l5v6d9rzfs47h7dv7xffcwkekuxcx3evnqpvuxu0',
            amount: '1',
            datumHash: '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7',
        },
        {
            format: CardanoTxOutputSerializationFormat.MAP_BABBAGE,
            address: 'addr1w9rhu54nz94k9l5v6d9rzfs47h7dv7xffcwkekuxcx3evnqpvuxu0',
            amount: '1',
            inlineDatum:
                '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7',
            referenceScript:
                '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7',
        },
    ],
    fee: '42',
    ttl: '10',
    validityIntervalStart: '20',
    certificates: [
        {
            type: CardanoCertificateType.STAKE_REGISTRATION,
            path: "m/1852'/1815'/0'/2/0",
        },
        {
            type: CardanoCertificateType.STAKE_DEREGISTRATION,
            path: "m/1852'/1815'/0'/2/0",
        },
        {
            type: CardanoCertificateType.STAKE_DELEGATION,
            path: "m/1852'/1815'/0'/2/0",
            pool: 'f61c42cbf7c8c53af3f520508212ad3e72f674f957fe23ff0acb4973',
        },
    ],
    withdrawals: [
        {
            path: "m/1852'/1815'/0'/2/0",
            amount: '1000',
        },
    ],
    auxiliaryData: {
        hash: 'ea4c91860dd5ec5449f8f985d227946ff39086b17f10b5afb93d12ee87050b6a',
    },
    scriptDataHash: 'd593fd793c377ac50a3169bb8378ffc257c944da31aa8f355dfa5a4f6ff89e02',
    protocolMagic: 764824073,
    networkId: 1,
    includeNetworkId: false,
});
```

#### Stake pool registration

```javascript
TrezorConnect.cardanoSignTransaction({
    signingMode: CardanoTxSigningMode.POOL_REGISTRATION_AS_OWNER,
    inputs: [
        {
            // notice no path is provided here
            prev_hash: '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7',
            prev_index: 0,
        },
    ],
    outputs: {
        address:
            'addr1q84sh2j72ux0l03fxndjnhctdg7hcppsaejafsa84vh7lwgmcs5wgus8qt4atk45lvt4xfxpjtwfhdmvchdf2m3u3hlsd5tq5r',
        amount: '1000000',
    },
    fee: '300000',
    ttl: '500000000',
    protocolMagic: 764824073,
    networkId: 1,
    includeNetworkId: false,
    certificates: [
        {
            type: CardanoCertificateType.STAKE_POOL_REGISTRATION,
            poolParameters: {
                poolId: 'f61c42cbf7c8c53af3f520508212ad3e72f674f957fe23ff0acb4973',
                vrfKeyHash: '198890ad6c92e80fbdab554dda02da9fb49d001bbd96181f3e07f7a6ab0d0640',
                pledge: '500000000', // amount in lovelace
                cost: '340000000', // amount in lovelace
                margin: {
                    // numerator/denominator should be <= 1 which is translated then to a percentage
                    numerator: '1',
                    denominator: '2',
                },
                rewardAccount: 'stake1uya87zwnmax0v6nnn8ptqkl6ydx4522kpsc3l3wmf3yswygwx45el', // bech32-encoded stake pool reward account
                owners: [
                    {
                        stakingKeyPath: "m/1852'/1815'/0'/2/0", // this is the path to the owner's key that will be signing the tx on Trezor
                    },
                    {
                        stakingKeyHash: '3a7f09d3df4cf66a7399c2b05bfa234d5a29560c311fc5db4c490711', // other owner
                    },
                ],
                relays: [
                    {
                        type: CardanoPoolRelayType.SINGLE_HOST_IP,
                        ipv4Address: '192.168.0.1',
                        ipv6Address: '2001:0db8:85a3:0000:0000:8a2e:0370:7334', // ipv6 address in full form
                        port: 1234,
                    },
                    {
                        type: CardanoPoolRelayType.SINGLE_HOST_IP,
                        ipv6Address: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
                        port: 1234,
                    },
                    {
                        type: CardanoPoolRelayType.SINGLE_HOST_IP,
                        ipv4Address: '192.168.0.1',
                        port: 1234,
                    },
                    {
                        type: CardanoPoolRelayType.SINGLE_HOST_NAME,
                        hostName: 'www.test.test',
                        port: 1234,
                    },
                    {
                        type: CardanoPoolRelayType.MULTIPLE_HOST_NAME,
                        hostName: 'www.test2.test', // max 64 characters long
                    },
                ],
                metadata: {
                    url: 'https://www.test.test', // max 64 characters long
                    hash: '914c57c1f12bbf4a82b12d977d4f274674856a11ed4b9b95bd70f5d41c5064a6',
                },
            },
        },
    ],
});
```

#### CIP-36 vote key registration

```javascript
TrezorConnect.cardanoSignTransaction({
    signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
    inputs: [
        {
            path: "m/1852'/1815'/0'/0/0",
            prev_hash: '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7',
            prev_index: 0,
        },
    ],
    outputs: [
        {
            address:
                'addr1q84sh2j72ux0l03fxndjnhctdg7hcppsaejafsa84vh7lwgmcs5wgus8qt4atk45lvt4xfxpjtwfhdmvchdf2m3u3hlsd5tq5r',
            amount: '3003112',
        },
    ],
    fee: '42',
    ttl: '10',
    auxiliaryData: {
        cVoteRegistrationParameters: {
            stakingPath: "m/1852'/1815'/0'/2/0",
            paymentAddressParameters: {
                addressType: CardanoAddressType.BASE,
                path: "m/1852'/1815'/0'/0/0",
                stakingPath: "m/1852'/1815'/0'/2/0",
            },
            nonce: '22634813',
            format: CardanoCVoteRegistrationFormat.CIP36,
            delegations: [
                {
                    votePublicKey:
                        '1af8fa0b754ff99253d983894e63a2b09cbb56c833ba18c3384210163f63dcfc',
                    weight: 1,
                },
            ],
        },
    },
    protocolMagic: 764824073,
    networkId: 1,
    includeNetworkId: false,
});
```

#### Multisig transaction

```javascript
TrezorConnect.cardanoSignTransaction({
    signingMode: CardanoTxSigningMode.MULTISIG_TRANSACTION,
    inputs: [
        {
            prev_hash: '1af8fa0b754ff99253d983894e63a2b09cbb56c833ba18c3384210163f63dcfc',
            prev_index: 0,
        },
    ],
    outputs: [
        {
            address: 'Ae2tdPwUPEZCanmBz5g2GEwFqKTKpNJcGYPKfDxoNeKZ8bRHr8366kseiK2',
            amount: '3003112',
        },
        {
            address:
                'addr1q84sh2j72ux0l03fxndjnhctdg7hcppsaejafsa84vh7lwgmcs5wgus8qt4atk45lvt4xfxpjtwfhdmvchdf2m3u3hlsd5tq5r',
            amount: '2000000',
            tokenBundle: [
                {
                    policyId: '95a292ffee938be03e9bae5657982a74e9014eb4960108c9e23a5b39',
                    tokenAmounts: [
                        {
                            assetNameBytes: '74652474436f696e',
                            amount: '7878754',
                        },
                    ],
                },
            ],
        },
    ],
    fee: '42',
    ttl: '10',
    validityIntervalStart: '20',
    certificates: [
        {
            type: CardanoCertificateType.STAKE_REGISTRATION,
            scriptHash: '29fb5fd4aa8cadd6705acc8263cee0fc62edca5ac38db593fec2f9fd',
        },
        {
            type: CardanoCertificateType.STAKE_DEREGISTRATION,
            scriptHash: '29fb5fd4aa8cadd6705acc8263cee0fc62edca5ac38db593fec2f9fd',
        },
        {
            type: CardanoCertificateType.STAKE_DELEGATION,
            scriptHash: '29fb5fd4aa8cadd6705acc8263cee0fc62edca5ac38db593fec2f9fd',
            pool: 'f61c42cbf7c8c53af3f520508212ad3e72f674f957fe23ff0acb4973',
        },
    ],
    withdrawals: [
        {
            scriptHash: '29fb5fd4aa8cadd6705acc8263cee0fc62edca5ac38db593fec2f9fd',
            amount: '1000',
        },
    ],
    auxiliaryData: {
        hash: 'ea4c91860dd5ec5449f8f985d227946ff39086b17f10b5afb93d12ee87050b6a',
    },
    mint: [
        {
            policyId: '95a292ffee938be03e9bae5657982a74e9014eb4960108c9e23a5b39',
            tokenAmounts: [
                {
                    assetNameBytes: '74652474436f696e',
                    mintAmount: '7878754',
                },
            ],
        },
    ],
    additionalWitnessRequests: ["m/1854'/1815'/0'/0/0", "m/1855'/1815'/0'"],
    protocolMagic: 764824073,
    networkId: 1,
    includeNetworkId: false,
});
```

#### Plutus transaction

```javascript
TrezorConnect.cardanoSignTransaction({
    signingMode: CardanoTxSigningMode.PLUTUS_TRANSACTION,
    inputs: [
        {
            path: "m/1852'/1815'/0'/0/0",
            prev_hash: '1af8fa0b754ff99253d983894e63a2b09cbb56c833ba18c3384210163f63dcfc',
            prev_index: 0,
        },
        {
            prev_hash: '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7',
            prev_index: 0,
        },
    ],
    outputs: [
        {
            address: 'Ae2tdPwUPEZCanmBz5g2GEwFqKTKpNJcGYPKfDxoNeKZ8bRHr8366kseiK2',
            amount: '3003112',
        },
        {
            address:
                'addr1q84sh2j72ux0l03fxndjnhctdg7hcppsaejafsa84vh7lwgmcs5wgus8qt4atk45lvt4xfxpjtwfhdmvchdf2m3u3hlsd5tq5r',
            amount: '2000000',
            tokenBundle: [
                {
                    policyId: '95a292ffee938be03e9bae5657982a74e9014eb4960108c9e23a5b39',
                    tokenAmounts: [
                        {
                            assetNameBytes: '74652474436f696e',
                            amount: '7878754',
                        },
                    ],
                },
            ],
        },
    ],
    fee: '42',
    ttl: '10',
    validityIntervalStart: '20',
    certificates: [
        {
            type: CardanoCertificateType.STAKE_REGISTRATION,
            path: "m/1852'/1815'/0'/2/0",
        },
        {
            type: CardanoCertificateType.STAKE_DEREGISTRATION,
            keyHash: '3a7f09d3df4cf66a7399c2b05bfa234d5a29560c311fc5db4c490711',
        },
        {
            type: CardanoCertificateType.STAKE_DELEGATION,
            scriptHash: '29fb5fd4aa8cadd6705acc8263cee0fc62edca5ac38db593fec2f9fd',
            pool: 'f61c42cbf7c8c53af3f520508212ad3e72f674f957fe23ff0acb4973',
        },
    ],
    withdrawals: [
        {
            path: "m/1852'/1815'/0'/2/0",
            amount: '1000',
        },
        {
            keyHash: '3a7f09d3df4cf66a7399c2b05bfa234d5a29560c311fc5db4c490711',
            amount: '1000',
        },
        {
            scriptHash: '29fb5fd4aa8cadd6705acc8263cee0fc62edca5ac38db593fec2f9fd',
            amount: '1000',
        },
    ],
    auxiliaryData: {
        hash: 'ea4c91860dd5ec5449f8f985d227946ff39086b17f10b5afb93d12ee87050b6a',
    },
    mint: [
        {
            policyId: '95a292ffee938be03e9bae5657982a74e9014eb4960108c9e23a5b39',
            tokenAmounts: [
                {
                    assetNameBytes: '74652474436f696e',
                    mintAmount: '7878754',
                },
            ],
        },
    ],
    scriptDataHash: 'd593fd793c377ac50a3169bb8378ffc257c944da31aa8f355dfa5a4f6ff89e02',
    collateralInputs: [
        {
            path: "m/1852'/1815'/0'/0/0",
            prev_hash: '1af8fa0b754ff99253d983894e63a2b09cbb56c833ba18c3384210163f63dcfc',
            prev_index: 0,
        },
    ],
    collateralReturn: {
        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
        address:
            'addr1q84sh2j72ux0l03fxndjnhctdg7hcppsaejafsa84vh7lwgmcs5wgus8qt4atk45lvt4xfxpjtwfhdmvchdf2m3u3hlsd5tq5r',
        amount: '1000',
        tokenBundle: [
            {
                policyId: '95a292ffee938be03e9bae5657982a74e9014eb4960108c9e23a5b39',
                tokenAmounts: [
                    {
                        assetNameBytes: '74652474436f696e',
                        amount: '7878754',
                    },
                ],
            },
        ],
    },
    totalCollateral: '1000',
    referenceInputs: [
        {
            path: "m/1852'/1815'/0'/0/0",
            prev_hash: '1af8fa0b754ff99253d983894e63a2b09cbb56c833ba18c3384210163f63dcfc',
            prev_index: 0,
        },
    ],
    requiredSigners: [
        {
            keyPath: "m/1852'/1815'/0'/0/1",
        },
        {
            keyHash: '3a7f09d3df4cf66a7399c2b05bfa234d5a29560c311fc5db4c490711',
        },
    ],
    additionalWitnessRequests: ["m/1852'/1815'/0'/0/2", "m/1854'/1815'/0'/0/0", "m/1855'/1815'/0'"],
    protocolMagic: 764824073,
    networkId: 1,
    includeNetworkId: false,
});
```

### Result

Since transaction streaming has been introduced to the Cardano implementation on Trezor because of memory constraints, Trezor no longer returns the whole serialized transaction as a result of the `CardanoSignTransaction` call. Instead the transaction hash, transaction witnesses and auxiliary data supplement are returned and the serialized transaction needs to be assembled by the client.

[CardanoSignedTxData type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/cardano/index.ts)

```javascript
{
    success: true,
    payload: {
        hash: string,
        witnesses: CardanoSignedTxWitness[],
        auxiliaryDataSupplement?: CardanoAuxiliaryDataSupplement,
    }
}
```

Example:

```javascript
{
    success: true,
    payload: {
        hash: "73e09bdebf98a9e0f17f86a2d11e0f14f4f8dae77cdf26ff1678e821f20c8db6",
        witnesses: [
            {
                type: CardanoTxWitnessType.BYRON_WITNESS,
                pubKey: '89053545a6c254b0d9b1464e48d2b5fcf91d4e25c128afb1fcfc61d0843338ea',
                signature:
                    'da07ac5246e3f20ebd1276476a4ae34a019dd4b264ffc22eea3c28cb0f1a6bb1c7764adeecf56bcb0bc6196fd1dbe080f3a7ef5b49f56980fe5b2881a4fdfa00',
                chainCode:
                    '26308151516f3b0e02bb1638142747863c520273ce9bd3e5cd91e1d46fe2a635',
            },
            {
                type: CardanoTxWitnessType.SHELLEY_WITNESS,
                pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                signature:
                    '622f22d03bc9651ddc5eb2f5dc709ac4240a64d2b78c70355dd62106543c407d56e8134c4df7884ba67c8a1b5c706fc021df5c4d0ff37385c30572e73c727d00',
                chainCode: null,
            },
        ],
        auxiliaryDataSupplement: {
            type: 1,
            auxiliaryDataHash:
                'a943e9166f1bb6d767b175384d3bd7d23645170df36fc1861fbf344135d8e120',
            cVoteRegistrationSignature:
                '74f27d877bbb4a5fc4f7c56869905c11f70bad0af3de24b23afaa1d024e750930f434ecc4b73e5d1723c2cb8548e8bf6098ac876487b3a6ed0891cb76994d409',
        },
    }
}
```

Error

```javascript
{
    success: false,
    payload: {
        error: string // error message
    }
}
```
