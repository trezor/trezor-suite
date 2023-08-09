import { TrezorConnect } from '../../..';

export const getAddress = async (api: TrezorConnect) => {
    // regular
    const singleAddress = await api.getAddress({ path: 'm/44' });
    if (singleAddress.success) {
        const { payload } = singleAddress;
        payload.address.toLowerCase();
        payload.path.map(a => a);
        payload.serializedPath.toLowerCase();
        // @ts-expect-error, payload is not a bundle
        payload.map(a => a);
    }

    // bundle
    const bundleAddress = await api.getAddress({ bundle: [{ path: 'm/44' }] });
    if (bundleAddress.success) {
        bundleAddress.payload.forEach(item => {
            item.address.toLowerCase();
            item.path.map(a => a);
            item.serializedPath.toLowerCase();
        });
        // @ts-expect-error, payload is an array
        bundleAddress.payload.address.toLowerCase();
    } else {
        bundleAddress.payload.error.toLowerCase();
    }

    // with all possible params
    api.getAddress({
        device: {
            path: '1',
            instance: 1,
            state: 'state@device-id:1',
        },
        useEmptyPassphrase: true,
        allowSeedlessDevice: false,
        keepSession: false,
        skipFinalReload: false,
        path: 'm/44',
        address: 'a',
        showOnTrezor: true,
        coin: 'btc',
        crossChain: true,
    });

    // with invalid params
    // @ts-expect-error
    api.getAddress();
    // @ts-expect-error
    api.getAddress({ coin: 'btc' });
    // @ts-expect-error
    api.getAddress({ path: 1 });
    // @ts-expect-error
    api.getAddress({ bundle: 1 });
};

export const getPublicKey = async (api: TrezorConnect) => {
    // regular
    const singlePK = await api.getPublicKey({ path: 'm/44' });
    if (singlePK.success) {
        const { payload } = singlePK;
        payload.path.map(a => a);
        payload.serializedPath.toLowerCase();
        payload.xpub.toLowerCase();
        payload.xpubSegwit?.toLowerCase();
        payload.chainCode.toLowerCase();
        payload.childNum.toFixed();
        payload.publicKey.toLowerCase();
        payload.fingerprint.toFixed();
        payload.depth.toFixed();
        // @ts-expect-error, payload is not a bundle
        payload.map(a => a);
    }

    // bundle
    const bundlePK = await api.getPublicKey({ bundle: [{ path: 'm/44' }] });
    if (bundlePK.success) {
        bundlePK.payload.forEach(item => {
            item.path.map(a => a);
            item.serializedPath.toLowerCase();
            item.xpub.toLowerCase();
            item.xpubSegwit?.toLowerCase();
            item.chainCode.toLowerCase();
            item.childNum.toFixed();
            item.publicKey.toLowerCase();
            item.fingerprint.toFixed();
            item.depth.toFixed();
        });
        // @ts-expect-error, payload is an array
        bundlePK.payload.xpub.toLowerCase();
    } else {
        bundlePK.payload.error.toLowerCase();
    }
};

export const signTransaction = async (api: TrezorConnect) => {
    // minimum required params
    api.signTransaction({
        inputs: [],
        outputs: [],
        coin: 'btc',
    });

    // with all possible params
    const sign = await api.signTransaction({
        inputs: [
            {
                address_n: [0],
                prev_index: 0,
                prev_hash: 'txhash',
                amount: '1',
                script_type: 'SPENDADDRESS',
            },
            {
                address_n: "m/44'/0'/0'/0/0",
                prev_index: 0,
                prev_hash: 'txhash',
                amount: '1',
                script_type: 'SPENDADDRESS',
            },
            {
                address_n: [0],
                prev_index: 0,
                prev_hash: 'txhash',
                amount: '1',
                script_type: 'SPENDWITNESS',
            },
            {
                address_n: [0],
                prev_index: 0,
                prev_hash: 'abcd',
                amount: '1',
                script_type: 'SPENDP2SHWITNESS',
            },
            {
                address_n: [0],
                prev_index: 0,
                prev_hash: 'txhash',
                amount: '1',
                script_type: 'SPENDMULTISIG',
                sequence: 1,
                multisig: {
                    pubkeys: [
                        { node: 'HDNodeAsString', address_n: [0] },
                        {
                            node: {
                                depth: 0,
                                fingerprint: 1,
                                child_num: 1,
                                chain_code: 'chain_code',
                                public_key: 'xpubABCD',
                            },
                            address_n: [0],
                        },
                    ],
                    signatures: ['signature'],
                    m: 0,
                },
            },
            {
                prev_index: 0,
                prev_hash: 'txhash',
                amount: '1',
                script_type: 'EXTERNAL',
                script_pubkey: '1001',
                script_sig: '1110',
            },
            {
                prev_index: 0,
                prev_hash: 'txhash',
                amount: '1',
                script_type: 'EXTERNAL',
                script_pubkey: '1001',
                witness: '1110',
            },
            {
                prev_index: 0,
                prev_hash: 'abcd',
                amount: '1',
                script_type: 'EXTERNAL',
                script_pubkey: '1001',
                ownership_proof: '0011',
                commitment_data: '1100',
            },
        ],
        outputs: [
            // external outputs
            {
                address: 'ExternalAddress',
                amount: '100',
                script_type: 'PAYTOADDRESS',
                orig_hash: 'origtxhash',
                orig_index: 1,
            },
            {
                address: 'ExternalAddress',
                amount: '100',
                script_type: 'PAYTOADDRESS',
                multisig: {
                    pubkeys: [{ node: 'HDNodeAsString', address_n: [0] }],
                    signatures: ['signature'],
                    m: 0,
                },
            },
            // change outputs
            {
                address_n: "m/44'/0'/0'/1/0",
                amount: '100',
                script_type: 'PAYTOADDRESS',
            },
            {
                address_n: [0],
                amount: '100',
                script_type: 'PAYTOADDRESS',
            },
            {
                address_n: [0],
                amount: '100',
                script_type: 'PAYTOWITNESS',
            },
            {
                address_n: [0],
                amount: '100',
                script_type: 'PAYTOP2SHWITNESS',
            },
            {
                address_n: [0],
                amount: '100',
                script_type: 'PAYTOMULTISIG',
                multisig: {
                    pubkeys: [{ node: 'HDNodeAsString', address_n: [0] }],
                    signatures: ['signature'],
                    m: 0,
                },
            },
            {
                amount: '0',
                op_return_data: 'deadbeef',
                script_type: 'PAYTOOPRETURN',
            },
        ],
        paymentRequests: [
            {
                recipient_name: 'trezor.io',
                signature: '000000',
                nonce: '1',
                amount: 1,
                memos: [
                    {
                        text_memo: { text: 'Invoice #87654321' },
                    },
                    {
                        coin_purchase_memo: {
                            coin_type: 1, // CoinInfo.slip44
                            amount: 1,
                            address: 'PROTO.Address.address',
                            mac: 'PROTO.Address.mac',
                        },
                    },
                    {
                        refund_memo: {
                            address: 'PROTO.Address.address',
                            mac: 'PROTO.Address.mac',
                        },
                    },
                ],
            },
        ],
        refTxs: [
            {
                hash: 'txhash',
                version: 1,
                inputs: [
                    {
                        prev_hash: 'txhash',
                        prev_index: 0,
                        script_sig: 'tx-signature',
                        sequence: 1,
                    },
                ],
                bin_outputs: [
                    {
                        amount: '100',
                        script_pubkey: 'tx-script-pubkey',
                    },
                ],
                lock_time: 1,
                extra_data: '00',
                expiry: 1,
                timestamp: 1,
                overwintered: false,
                version_group_id: 4,
                branch_id: 1,
            },
            {
                hash: 'origTxHash',
                version: 1,
                inputs: [
                    {
                        address_n: [],
                        prev_hash: 'txhash',
                        prev_index: 0,
                        script_sig: 'tx-signature',
                        sequence: 1,
                        script_type: 'SPENDP2SHWITNESS',
                        multisig: {
                            pubkeys: [
                                { node: 'HDNodeAsString', address_n: [0] },
                                {
                                    node: {
                                        depth: 0,
                                        fingerprint: 1,
                                        child_num: 1,
                                        chain_code: 'chain_code',
                                        public_key: 'xpubABCD',
                                    },
                                    address_n: [0],
                                },
                            ],
                            signatures: ['signature'],
                            m: 0,
                        },
                        amount: '1',
                        decred_tree: 1,
                        witness: 'w',
                        ownership_proof: 'ownership_proof',
                        commitment_data: 'commitment_data',
                        orig_hash: 'origtxhash',
                        orig_index: 1,
                    },
                ],
                outputs: [
                    {
                        address: 'a',
                        amount: '100',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: [0],
                        amount: '100',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: [0],
                        amount: '100',
                        script_type: 'PAYTOSCRIPTHASH',
                    },
                    {
                        address_n: [0],
                        amount: '100',
                        script_type: 'PAYTOMULTISIG',
                    },
                    {
                        address_n: [0],
                        amount: '100',
                        script_type: 'PAYTOWITNESS',
                    },
                    {
                        address_n: [0],
                        amount: '100',
                        script_type: 'PAYTOP2SHWITNESS',
                    },
                    {
                        amount: '0',
                        op_return_data: 'deadbeef',
                        script_type: 'PAYTOOPRETURN',
                    },
                ],
                lock_time: 1,
                extra_data: '00',
                expiry: 1,
                timestamp: 1,
                overwintered: false,
                version_group_id: 4,
                branch_id: 1,
            },
        ],
        account: {
            addresses: {
                used: [],
                unused: [],
                change: [{ path: 'm/44', address: 'a', transfers: 0 }],
            },
        },
        coin: 'btc',
        locktime: 0,
        timestamp: 1,
        version: 0,
        expiry: 0,
        overwintered: true,
        versionGroupId: 4,
        branchId: 1,
        push: true,
        // common:
        useEmptyPassphrase: true,
        allowSeedlessDevice: false,
        keepSession: false,
        skipFinalReload: false,
    });

    if (sign.success) {
        const { payload } = sign;
        payload.signatures.map(s => s.toLowerCase());
        payload.serializedTx.toLowerCase();
        payload.txid?.toLowerCase();
    }

    // with invalid params
    // @ts-expect-error
    api.signTransaction();
    // @ts-expect-error
    api.signTransaction({ coin: 'btc' });

    api.signTransaction({
        inputs: [
            {
                address_n: [0],
                prev_index: 0,
                prev_hash: 'txhash',
                amount: '1',
                // @ts-expect-error
                script_type: 'SPENDADDRESS-2',
            },
            // @ts-expect-error missing address_n
            {
                prev_index: 0,
                prev_hash: 'txhash',
                amount: '1',
            },
            // @ts-expect-error missing script_pubkey
            {
                prev_index: 0,
                prev_hash: 'txhash',
                amount: '1',
                script_type: 'EXTERNAL',
            },
        ],
        outputs: [
            // @ts-expect-error unexpected address_n
            {
                address_n: [0],
                amount: '0',
                op_return_data: 'deadbeef',
                script_type: 'PAYTOOPRETURN',
            },
            // @ts-expect-error unexpected script_type
            {
                address: 'abcd',
                amount: '100',
                script_type: 'PAYTOP2SHWITNESS',
            },
            // @ts-expect-error unexpected address
            {
                address: 'abcd',
                amount: '0',
                op_return_data: 'deadbeef',
                script_type: 'PAYTOOPRETURN',
            },
        ],
        coin: 'btc',
    });
};

export const pushTransaction = async (api: TrezorConnect) => {
    const push = await api.pushTransaction({ tx: 'serializedTX', coin: 'btc' });
    if (push.success) {
        push.payload.txid.toLowerCase();
    }

    // with invalid params
    // @ts-expect-error
    api.pushTransaction();
    // @ts-expect-error
    api.pushTransaction({ coin: 'btc' });
};

export const composeTransaction = async (api: TrezorConnect) => {
    // Method with mixed params and mixed responses

    const compose = await api.composeTransaction({
        outputs: [],
        coin: 'btc',
    });
    if (compose.success) {
        compose.payload.serializedTx.toLowerCase();
    }

    const precompose = await api.composeTransaction({
        outputs: [],
        account: {
            path: 'm/49',
            addresses: {
                used: [],
                unused: [],
                change: [],
            },
            utxo: [],
        },
        feeLevels: [{ feePerUnit: '1' }],
        coin: 'btc',
    });

    if (precompose.success) {
        const tx = precompose.payload[0];
        if (tx.type === 'error') {
            tx.error.toLowerCase();
        }
        if (tx.type === 'nonfinal') {
            tx.bytes.toFixed();
            tx.feePerByte.toLowerCase();
            tx.inputs.map(a => a);
        }
        if (tx.type === 'final') {
            tx.inputs.map(a => a);
            tx.outputs.map(a => a);
        }
    } else {
        precompose.payload.error.toLowerCase();
        // @ts-expect-error
        precompose.payload.type.toLowerCase();
    }
};

export const getAccountInfo = async (api: TrezorConnect) => {
    // minimum required params
    api.getAccountInfo({ coin: 'btc' });

    const account = await api.getAccountInfo({
        coin: 'btc',
        path: 'm/44',
        descriptor: 'xpub',
        details: 'txs',
        tokens: 'used',
        page: 1,
        pageSize: 2,
        from: 1,
        to: 100,
        contractFilter: 'address',
        gap: 25,
        marker: {
            ledger: 1,
            seq: 1,
        },
        defaultAccountType: 'p2sh',
    });
    if (account.success) {
        const { payload } = account;
        if (payload.empty === false) {
            payload.path?.toLowerCase();
        }
        payload.descriptor.toLowerCase();
        payload.balance.toLowerCase();
        payload.availableBalance.toLowerCase();
        if (payload.tokens) {
            payload.tokens.map(t => t.contract.toLowerCase());
        }
        if (payload.addresses) {
            payload.addresses.used.map(a => a.address.toLowerCase());
            payload.addresses.unused.map(a => a.address.toLowerCase());
            payload.addresses.change.map(a => a.address.toLowerCase());
        }
        if (payload.utxo) {
            payload.utxo.map(u => u.address.toLowerCase());
        }

        payload.history.total.toFixed();
        payload.history.tokens?.toFixed();
        payload.history.unconfirmed.toFixed();
        payload.history.transactions?.map(tx =>
            tx.type === 'sent' ? tx.targets.join(',') : tx.tokens.join(','),
        );
        payload.history.txids?.map(tx => tx.toLowerCase());

        if (payload.page) {
            payload.page.index.toFixed();
            payload.page.size.toFixed();
            payload.page.total.toFixed();
        }

        if (payload.marker) {
            payload.marker.ledger.toFixed();
            payload.marker.seq.toFixed();
        }

        if (payload.misc) {
            payload.misc.nonce?.toLowerCase();
            payload.misc.sequence?.toFixed();
            payload.misc.reserve?.toLowerCase();
        }
    }

    const bundle = await api.getAccountInfo({
        bundle: [
            {
                coin: 'btc',
                path: 'm/44',
                descriptor: 'xpub',
            },
        ],
    });

    if (bundle.success) {
        bundle.payload.forEach(item => {
            if (item) {
                item.descriptor.toLowerCase();
            }
        });
    }
};

export const getAccountDescriptor = async (api: TrezorConnect) => {
    const account = await api.getAccountDescriptor({
        coin: 'btc',
        path: 'm/44',
        derivationType: 2,
        suppressBackupWarning: true,
    });
    if (account.success) {
        const { payload } = account;
        payload.descriptor.toLowerCase();
        payload.path.toLowerCase();
        payload.legacyXpub?.toLowerCase();
    }

    const bundle = await api.getAccountDescriptor({
        bundle: [
            {
                coin: 'btc',
                path: 'm/44',
            },
        ],
    });

    if (bundle.success) {
        bundle.payload.forEach(item => {
            if (item) {
                item.descriptor.toLowerCase();
            }
        });
    }

    // @ts-expect-error missing "coin" param
    api.getAccountDescriptor({ path: 'm/44' });

    // @ts-expect-error missing "path" param
    api.getAccountDescriptor({ coin: 'btc' });
};

export const signMessage = async (api: TrezorConnect) => {
    const sign = await api.signMessage({ path: 'm/44', coin: 'btc', message: 'foo' });
    if (sign.success) {
        const { payload } = sign;
        payload.address.toLowerCase();
        payload.signature.toLowerCase();
    }
    const verify = await api.verifyMessage({
        address: 'a',
        signature: 'a',
        message: 'foo',
        coin: 'btc',
    });
    if (verify.success) {
        const { payload } = verify;
        payload.message.toLowerCase();
    }
};

export const getOwnershipId = async (api: TrezorConnect) => {
    const result = await api.getOwnershipId({ path: 'm/44' });
    if (result.success) {
        const { payload } = result;
        payload.ownership_id.toLowerCase();
    }

    api.getOwnershipId({
        path: 'm/44',
        coin: 'btc',
        multisig: {
            pubkeys: [{ node: 'HDNodeAsString', address_n: [0] }],
            signatures: ['signature'],
            m: 0,
        },
        scriptType: 'SPENDTAPROOT',
    });

    // bundle
    const bundleId = await api.getOwnershipId({ bundle: [{ path: 'm/44' }] });
    if (bundleId.success) {
        bundleId.payload.forEach(item => {
            item.ownership_id.toLowerCase();
        });
        // @ts-expect-error
        bundleId.payload.ownership_id.toLowerCase();
    } else {
        bundleId.payload.error.toLowerCase();
    }

    // @ts-expect-error missing path
    api.getOwnershipId({ coin: 'btc' });
};

export const getOwnershipProof = async (api: TrezorConnect) => {
    const result = await api.getOwnershipProof({ path: 'm/44' });
    if (result.success) {
        const { payload } = result;
        payload.ownership_proof.toLowerCase();
        payload.signature.toLowerCase();
    }

    api.getOwnershipProof({
        path: 'm/44',
        coin: 'btc',
        scriptType: 'SPENDTAPROOT',
        multisig: {
            pubkeys: [{ node: 'HDNodeAsString', address_n: [0] }],
            signatures: ['signature'],
            m: 0,
        },
        userConfirmation: true,
        ownershipIds: ['dead'],
        commitmentData: 'beef',
    });

    // bundle
    const bundleId = await api.getOwnershipProof({ bundle: [{ path: 'm/44' }] });
    if (bundleId.success) {
        bundleId.payload.forEach(item => {
            item.ownership_proof.toLowerCase();
        });
        // @ts-expect-error
        bundleId.payload.ownership_proof.toLowerCase();
    } else {
        bundleId.payload.error.toLowerCase();
    }

    // @ts-expect-error missing path
    api.getOwnershipProof({ coin_name: 'btc' });
};

export const authorizeCoinjoin = async (api: TrezorConnect) => {
    const result = await api.authorizeCoinjoin({
        path: 'm/44',
        coordinator: 'TrezorCoinjoinCoordinator',
        maxRounds: 1,
        maxCoordinatorFeeRate: 100,
        maxFeePerKvbyte: 100,
    });
    if (result.success) {
        const { payload } = result;
        payload.message.toLowerCase();
    }

    api.authorizeCoinjoin({
        path: 'm/44',
        coordinator: 'TrezorCoinjoinCoordinator',
        maxRounds: 1,
        maxCoordinatorFeeRate: 100,
        maxFeePerKvbyte: 100,
        coin: 'btc',
        scriptType: 'SPENDTAPROOT',
        amountUnit: 1, // MILLIBITCOIN
    });

    // @ts-expect-error incomplete params
    api.authorizeCoinjoin({ path: 'm/44', coordinator: '' });
    // @ts-expect-error incomplete params
    api.authorizeCoinjoin({ path: 'm/44', maxRounds: 1 });
    // @ts-expect-error incomplete params
    api.authorizeCoinjoin({ coordinator: '', maxCoordinatorFeeRate: 1 });
};
