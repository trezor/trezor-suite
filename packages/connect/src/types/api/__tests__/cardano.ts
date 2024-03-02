import { TrezorConnect, PROTO } from '../../..';

const {
    CardanoAddressType,
    CardanoCVoteRegistrationFormat,
    CardanoCertificateType,
    CardanoNativeScriptHashDisplayFormat,
    CardanoNativeScriptType,
    CardanoPoolRelayType,
    CardanoTxOutputSerializationFormat,
    CardanoTxSigningMode,
} = PROTO;

export const cardanoGetAddress = async (api: TrezorConnect) => {
    // regular
    const singleAddress = await api.cardanoGetAddress({
        addressParameters: {
            addressType: CardanoAddressType.BASE,
            path: 'm/44',
            stakingPath: 'm/44',
            stakingKeyHash: 'aaff00..',
            certificatePointer: {
                blockIndex: 0,
                txIndex: 1,
                certificateIndex: 2,
            },
            paymentScriptHash: 'aaff00..',
            stakingScriptHash: 'aaff00..',
        },
        protocolMagic: 0,
        networkId: 0,
    });
    if (singleAddress.success) {
        const { payload } = singleAddress;
        payload.address.toLowerCase();
        payload.protocolMagic.toFixed();
        payload.networkId.toFixed();
        payload.serializedPath.toLowerCase();
        payload.serializedStakingPath.toLowerCase();
        const { addressParameters } = payload;
        addressParameters.addressType.toFixed();
        if (Array.isArray(addressParameters.path)) {
            addressParameters.path.map(p => p);
        } else {
            addressParameters.path?.toLowerCase();
        }
        if (Array.isArray(addressParameters.stakingPath)) {
            addressParameters.stakingPath.map(p => p);
        } else {
            addressParameters.stakingPath?.toLowerCase();
        }
        addressParameters.stakingKeyHash?.toLowerCase();
        const { certificatePointer } = addressParameters;
        if (certificatePointer) {
            certificatePointer.blockIndex.toFixed();
            certificatePointer.txIndex.toFixed();
            certificatePointer.certificateIndex.toFixed();
        }
        addressParameters.paymentScriptHash?.toLowerCase();
        addressParameters.stakingScriptHash?.toLowerCase();
        // @ts-expect-error, payload is not a bundle
        payload.filter(a => a);
    }

    // bundle
    const bundleAddress = await api.cardanoGetAddress({
        bundle: [
            {
                addressParameters: {
                    addressType: CardanoAddressType.BASE,
                    path: 'm/44',
                    stakingPath: 'm/44',
                    stakingKeyHash: 'aaff00..',
                    certificatePointer: {
                        blockIndex: 0,
                        txIndex: 1,
                        certificateIndex: 2,
                    },
                    paymentScriptHash: 'aaff00..',
                    stakingScriptHash: 'aaff00..',
                },
                protocolMagic: 0,
                networkId: 0,
            },
        ],
    });
    if (bundleAddress.success) {
        bundleAddress.payload.forEach(item => {
            item.address.toLowerCase();
            item.protocolMagic.toFixed();
            item.networkId.toFixed();
            item.serializedPath.toLowerCase();
            item.serializedStakingPath.toLowerCase();
            const { addressParameters } = item;
            addressParameters.addressType.toFixed();
            if (Array.isArray(addressParameters.path)) {
                addressParameters.path.map(p => p);
            } else {
                addressParameters.path?.toLowerCase();
            }
            if (Array.isArray(addressParameters.stakingPath)) {
                addressParameters.stakingPath.map(p => p);
            } else {
                addressParameters.stakingPath?.toLowerCase();
            }
            addressParameters.stakingKeyHash?.toLowerCase();
            const { certificatePointer } = addressParameters;
            if (certificatePointer) {
                certificatePointer.blockIndex.toFixed();
                certificatePointer.txIndex.toFixed();
                certificatePointer.certificateIndex.toFixed();
            }
            addressParameters.paymentScriptHash?.toLowerCase();
            addressParameters.stakingScriptHash?.toLowerCase();
        });
        // @ts-expect-error, payload is an array
        bundleAddress.payload.address.toLowerCase();
    } else {
        bundleAddress.payload.error.toLowerCase();
    }

    // with all possible params
    api.cardanoGetAddress({
        device: {
            path: '1',
            instance: 1,
            state: 'state@device-id:1',
        },
        useEmptyPassphrase: true,
        allowSeedlessDevice: false,
        keepSession: false,
        skipFinalReload: false,
        addressParameters: {
            addressType: CardanoAddressType.BASE,
            path: 'm/44',
            stakingPath: 'm/44',
            stakingKeyHash: 'aaff00..',
            certificatePointer: {
                blockIndex: 0,
                txIndex: 1,
                certificateIndex: 2,
            },
            paymentScriptHash: 'aaff00..',
            stakingScriptHash: 'aaff00..',
        },
        address: 'a',
        protocolMagic: 0,
        networkId: 0,
        showOnTrezor: true,
    });

    // with invalid params
    // @ts-expect-error
    api.cardanoGetAddress();
    // @ts-expect-error
    api.cardanoGetAddress({ coin: 'btc' });
    // @ts-expect-error
    api.cardanoGetAddress({ addressParameters: { path: 1 } });
    // @ts-expect-error
    api.cardanoGetAddress({ bundle: 1 });
};

export const cardanoGetNativeScriptHash = async (api: TrezorConnect) => {
    const result = await api.cardanoGetNativeScriptHash({
        script: {
            type: CardanoNativeScriptType.PUB_KEY,
            scripts: [
                {
                    type: CardanoNativeScriptType.PUB_KEY,
                    scripts: [],
                    keyHash: '00aaff...',
                    keyPath: 'm/44',
                    requiredSignaturesCount: 0,
                    invalidBefore: '0',
                    invalidHereafter: '0',
                },
            ],
            keyHash: '00aaff...',
            keyPath: 'm/44',
            requiredSignaturesCount: 0,
            invalidBefore: '0',
            invalidHereafter: '0',
        },
        displayFormat: CardanoNativeScriptHashDisplayFormat.HIDE,
    });

    if (result.success) {
        result.payload.scriptHash.toLowerCase();
    } else {
        result.payload.error.toLowerCase();
    }
};

export const cardanoGetPublicKey = async (api: TrezorConnect) => {
    // regular
    const singlePK = await api.cardanoGetPublicKey({ path: 'm/44' });
    if (singlePK.success) {
        const { payload } = singlePK;
        payload.path.map(p => p);
        payload.serializedPath.toLowerCase();
        payload.publicKey.toLowerCase();
        payload.node.chain_code.toLowerCase();
        // @ts-expect-error
        payload.map(p => p);
    }

    // bundle
    const bundlePK = await api.cardanoGetPublicKey({ bundle: [{ path: 'm/44' }] });
    if (bundlePK.success) {
        bundlePK.payload.forEach(item => {
            item.path.map(p => p);
            item.serializedPath.toLowerCase();
            item.publicKey.toLowerCase();
            item.node.chain_code.toLowerCase();
        });
        // @ts-expect-error
        bundlePK.payload.path.toLowerCase();
    } else {
        bundlePK.payload.error.toLowerCase();
    }
};

export const cardanoSignTransaction = async (api: TrezorConnect) => {
    const sign = await api.cardanoSignTransaction({
        inputs: [
            {
                prev_hash: '1af..',
                path: 'm/44',
                prev_index: 0,
            },
        ],
        outputs: [
            {
                address: 'Ae2..',
                amount: '3003112',
                tokenBundle: [
                    {
                        policyId: 'aaff00..',
                        tokenAmounts: [{ assetNameBytes: 'aaff00..', amount: '3003112' }],
                    },
                ],
                datumHash: 'aaff00..',
                format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
                inlineDatum: 'aaff00..',
                referenceScript: 'aaff00..',
            },
            {
                addressParameters: {
                    addressType: CardanoAddressType.BASE,
                    path: 'm/44',
                    stakingPath: 'm/44',
                    stakingKeyHash: 'aaff00..',
                    certificatePointer: {
                        blockIndex: 0,
                        txIndex: 0,
                        certificateIndex: 0,
                    },
                },
                amount: '3003112',
                tokenBundle: [
                    {
                        policyId: 'aaff00..',
                        tokenAmounts: [{ assetNameBytes: 'aaff00..', amount: '3003112' }],
                    },
                ],
                datumHash: 'aaff00..',
                format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
                inlineDatum: 'aaff00..',
                referenceScript: 'aaff00..',
            },
        ],
        certificates: [
            {
                type: CardanoCertificateType.STAKE_REGISTRATION,
                path: 'm/44',
                pool: 'aaff00..',
                poolParameters: {
                    poolId: 'aaff00..',
                    vrfKeyHash: 'aaff00..',
                    pledge: '500000000',
                    cost: '340000000',
                    margin: {
                        numerator: '1',
                        denominator: '2',
                    },
                    rewardAccount: 'stake1uya87zwnmax0v6nnn8ptqkl6ydx4522kpsc3l3wmf3yswygwx45el',
                    owners: [
                        {
                            stakingKeyPath: "m/1852'",
                            stakingKeyHash: 'aaff00..',
                        },
                        {
                            stakingKeyHash: 'aaff00..',
                        },
                    ],
                    relays: [
                        {
                            type: CardanoPoolRelayType.SINGLE_HOST_IP,
                            ipv4Address: '192.168.0.1',
                            ipv6Address: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
                            port: 1234,
                            hostName: 'www.test2.test',
                        },
                    ],
                    metadata: {
                        url: 'https://www.test.test',
                        hash: 'aaff00..',
                    },
                },
                scriptHash: 'aaff00..',
                keyHash: 'aaff00..',
            },
        ],
        withdrawals: [
            { path: 'm/44', amount: '3003112', scriptHash: 'aaff00..', keyHash: 'aaff00..' },
        ],
        mint: [
            {
                policyId: 'aaff00..',
                tokenAmounts: [{ assetNameBytes: 'aaff00..', mintAmount: '-3003112' }],
            },
        ],
        auxiliaryData: {
            hash: 'aaff00..',
            cVoteRegistrationParameters: {
                votePublicKey: 'aaff00..',
                stakingPath: 'm/44',
                paymentAddressParameters: {
                    addressType: CardanoAddressType.REWARD,
                    path: 'm/44',
                    stakingPath: 'm/44',
                    stakingKeyHash: 'aaff00..',
                    certificatePointer: {
                        blockIndex: 0,
                        txIndex: 0,
                        certificateIndex: 0,
                    },
                },
                nonce: '0',
                format: CardanoCVoteRegistrationFormat.CIP36,
                delegations: [
                    {
                        votePublicKey: 'aaff00..',
                        weight: 1,
                    },
                ],
                votingPurpose: 0,
                paymentAddress: 'Ae2..',
            },
        },
        additionalWitnessRequests: ['m/44'],
        fee: '42',
        ttl: '10',
        validityIntervalStart: '20',
        scriptDataHash: 'aaff00..',
        collateralInputs: [
            {
                path: 'm/44',
                prev_hash: '1af..',
                prev_index: 0,
            },
        ],
        requiredSigners: [
            {
                keyPath: 'm/44',
                keyHash: '1af..',
            },
        ],
        collateralReturn: {
            addressParameters: {
                addressType: CardanoAddressType.BASE,
                path: 'm/44',
                stakingPath: 'm/44',
                stakingKeyHash: 'aaff00..',
                certificatePointer: {
                    blockIndex: 0,
                    txIndex: 0,
                    certificateIndex: 0,
                },
            },
            amount: '3003112',
            tokenBundle: [
                {
                    policyId: 'aaff00..',
                    tokenAmounts: [{ assetNameBytes: 'aaff00..', amount: '3003112' }],
                },
            ],
            datumHash: 'aaff00..',
            format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
            inlineDatum: 'aaff00..',
            referenceScript: 'aaff00..',
        },
        totalCollateral: '0',
        referenceInputs: [
            {
                prev_hash: '1af..',
                prev_index: 0,
            },
        ],
        protocolMagic: 0,
        networkId: 0,
        signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
        includeNetworkId: false,
    });

    if (sign.success) {
        const { payload } = sign;
        payload.hash.toLowerCase();
        payload.witnesses.forEach(witness => {
            witness.type.toFixed();
            witness.pubKey.toLowerCase();
            witness.signature.toLowerCase();
            witness.chainCode?.toLowerCase();
        });
        const { auxiliaryDataSupplement } = payload;
        if (auxiliaryDataSupplement) {
            const { type, auxiliaryDataHash, cVoteRegistrationSignature } = auxiliaryDataSupplement;
            type.toFixed();
            auxiliaryDataHash.toLowerCase();
            cVoteRegistrationSignature?.toLowerCase();
        }
    }
};

export const cardanoSignMessage = async (api: TrezorConnect) => {
    const sign = await api.cardanoSignMessage({
        signingPath: 'm/44',
        payload: 'Test..',
        hashPayload: true,
        preferHexDisplay: false,
        networkId: 0,
        protocolMagic: 0,
        addressParameters: {
            addressType: CardanoAddressType.BASE,
            path: 'm/44',
            stakingPath: 'm/44',
            stakingKeyHash: 'aaff00..',
            stakingScriptHash: 'aaff00..',
            paymentScriptHash: 'aaff00..',
            certificatePointer: {
                blockIndex: 0,
                txIndex: 0,
                certificateIndex: 0,
            },
        },
        derivationType: PROTO.CardanoDerivationType.ICARUS_TREZOR,
    });

    if (sign.success) {
        const { payload } = sign;
        payload.payload.toLowerCase();
        payload.signature.toLowerCase();
        payload.pubKey.toLowerCase();
        const { headers } = payload;
        headers.protected[1].toFixed();
        headers.protected.address.toLowerCase();
        [true, false].includes(headers.unprotected.hashed);
        headers.unprotected.version.toFixed();
    }
};
