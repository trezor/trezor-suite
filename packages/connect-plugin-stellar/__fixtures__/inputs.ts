import {
    Account,
    Asset,
    Memo,
    Networks,
    Operation,
    TransactionBuilder,
    Keypair,
    StrKey,
} from '@stellar/stellar-sdk';

const nativeAsset = Asset.native();
const credit4Asset = new Asset('USD', 'GCNY5OXYSY4FKHOPT2SPOQZAOEIGXB5LBYW3HVU3OWSTQITS65M5RCNY');
const credit12Asset = new Asset(
    'CATCOIN',
    'GDJVFDG5OCW5PYWHB64MGTHGFF57DRRJEDUEFDEL2SLNIOONHYJWHA3Z',
);

const kp0 = Keypair.fromSecret('SAMWF63FZ5ZNHY75SNYNAFMWTL5FPBMIV7DLB3UDAVLL7DKPI5ZFS2S6');
const kp1 = Keypair.fromSecret('SAEHLO5233DRWHKG3GN7TLJIHCWWZOACUEYRRKW7FPWC3H4EYX7NEPL4');
const kp2 = Keypair.fromSecret('SATIN2FUZMRCEU4AWQDY7ZDEX26MF33HRIXCK2L5SPNEABPIT22M446F');

const DEFAULT_SOURCE = kp0.publicKey();
const DEFAULT_SEQUENCE = '103420918407103888';
const DEFAULT_FEE = 100;
const DEFAULT_NETWORK = Networks.PUBLIC;
const DEFAULT_TIMEBOUNDS = {
    minTime: 1600000000,
    maxTime: 1700000000,
};
const DEFAULT_MEMO = Memo.text('trezor stellar');

function build_tx(
    source: any,
    sequence: any,
    fee: any,
    networkPassphrase: any,
    timebounds: any,
    memo: any,
    ...ops: any[]
) {
    const sourceAccount = new Account(source, sequence);
    const tx = new TransactionBuilder(sourceAccount, {
        fee,
        networkPassphrase,
        timebounds,
        memo,
    });
    ops.forEach(op => {
        tx.addOperation(op);
    });
    return tx.build();
}

export const transformTransactionInputs = [
    {
        description: 'create account operation',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.createAccount({
                destination: kp1.publicKey(),
                startingBalance: '123.456789',
            });

            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [
                    {
                        destination: 'GC2GT6BHYJUKD7SVAKXVLBYBCELCHY577CAXJM5QNVLERDGFF37LR35K',
                        startingBalance: '1234567890',
                        type: 'createAccount',
                    },
                ],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'payment operation',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.payment({
                destination: kp1.publicKey(),
                asset: credit4Asset,
                amount: '10000',
            });

            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [
                    {
                        amount: '100000000000',
                        asset: {
                            code: 'USD',
                            issuer: 'GCNY5OXYSY4FKHOPT2SPOQZAOEIGXB5LBYW3HVU3OWSTQITS65M5RCNY',
                            type: 1,
                        },
                        destination: 'GC2GT6BHYJUKD7SVAKXVLBYBCELCHY577CAXJM5QNVLERDGFF37LR35K',
                        type: 'payment',
                    },
                ],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'path payment struct receive operation',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.pathPaymentStrictReceive({
                destination: kp1.publicKey(),
                sendAsset: nativeAsset,
                sendMax: '100',
                destAsset: credit4Asset,
                destAmount: '200',
                path: [nativeAsset, credit4Asset, credit12Asset],
            });
            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [
                    {
                        destAmount: '2000000000',
                        destAsset: {
                            code: 'USD',
                            issuer: 'GCNY5OXYSY4FKHOPT2SPOQZAOEIGXB5LBYW3HVU3OWSTQITS65M5RCNY',
                            type: 1,
                        },
                        destination: 'GC2GT6BHYJUKD7SVAKXVLBYBCELCHY577CAXJM5QNVLERDGFF37LR35K',
                        path: [
                            { code: 'XLM', type: 0 },
                            {
                                code: 'USD',
                                issuer: 'GCNY5OXYSY4FKHOPT2SPOQZAOEIGXB5LBYW3HVU3OWSTQITS65M5RCNY',
                                type: 1,
                            },
                            {
                                code: 'CATCOIN',
                                issuer: 'GDJVFDG5OCW5PYWHB64MGTHGFF57DRRJEDUEFDEL2SLNIOONHYJWHA3Z',
                                type: 2,
                            },
                        ],
                        sendAsset: { code: 'XLM', type: 0 },
                        sendMax: '1000000000',
                        type: 'pathPaymentStrictReceive',
                    },
                ],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'path payment struct receive operation (empty path)',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.pathPaymentStrictReceive({
                destination: kp1.publicKey(),
                sendAsset: nativeAsset,
                sendMax: '100',
                destAsset: credit4Asset,
                destAmount: '200',
            });
            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [
                    {
                        destAmount: '2000000000',
                        destAsset: {
                            code: 'USD',
                            issuer: 'GCNY5OXYSY4FKHOPT2SPOQZAOEIGXB5LBYW3HVU3OWSTQITS65M5RCNY',
                            type: 1,
                        },
                        destination: 'GC2GT6BHYJUKD7SVAKXVLBYBCELCHY577CAXJM5QNVLERDGFF37LR35K',
                        path: [],
                        sendAsset: { code: 'XLM', type: 0 },
                        sendMax: '1000000000',
                        type: 'pathPaymentStrictReceive',
                    },
                ],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'path payment struct send operation',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.pathPaymentStrictSend({
                destination: kp1.publicKey(),
                sendAsset: nativeAsset,
                sendAmount: '100',
                destAsset: credit4Asset,
                destMin: '200',
                path: [nativeAsset, credit4Asset, credit12Asset],
            });
            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [
                    {
                        destAsset: {
                            code: 'USD',
                            issuer: 'GCNY5OXYSY4FKHOPT2SPOQZAOEIGXB5LBYW3HVU3OWSTQITS65M5RCNY',
                            type: 1,
                        },
                        destMin: '2000000000',
                        destination: 'GC2GT6BHYJUKD7SVAKXVLBYBCELCHY577CAXJM5QNVLERDGFF37LR35K',
                        path: [
                            { code: 'XLM', type: 0 },
                            {
                                code: 'USD',
                                issuer: 'GCNY5OXYSY4FKHOPT2SPOQZAOEIGXB5LBYW3HVU3OWSTQITS65M5RCNY',
                                type: 1,
                            },
                            {
                                code: 'CATCOIN',
                                issuer: 'GDJVFDG5OCW5PYWHB64MGTHGFF57DRRJEDUEFDEL2SLNIOONHYJWHA3Z',
                                type: 2,
                            },
                        ],
                        sendAmount: '1000000000',
                        sendAsset: { code: 'XLM', type: 0 },
                        type: 'pathPaymentStrictSend',
                    },
                ],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'path payment struct send operation (empty path)',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.pathPaymentStrictSend({
                destination: kp1.publicKey(),
                sendAsset: nativeAsset,
                sendAmount: '100',
                destAsset: credit4Asset,
                destMin: '200',
            });
            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [
                    {
                        destAsset: {
                            code: 'USD',
                            issuer: 'GCNY5OXYSY4FKHOPT2SPOQZAOEIGXB5LBYW3HVU3OWSTQITS65M5RCNY',
                            type: 1,
                        },
                        destMin: '2000000000',
                        destination: 'GC2GT6BHYJUKD7SVAKXVLBYBCELCHY577CAXJM5QNVLERDGFF37LR35K',
                        path: [],
                        sendAmount: '1000000000',
                        sendAsset: { code: 'XLM', type: 0 },
                        type: 'pathPaymentStrictSend',
                    },
                ],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'create passive sell offer operation',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.createPassiveSellOffer({
                selling: nativeAsset,
                buying: credit4Asset,
                amount: '10',
                price: '1.25',
            });

            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [
                    {
                        amount: '100000000',
                        buying: {
                            code: 'USD',
                            issuer: 'GCNY5OXYSY4FKHOPT2SPOQZAOEIGXB5LBYW3HVU3OWSTQITS65M5RCNY',
                            type: 1,
                        },
                        price: { d: 4, n: 5 },
                        selling: { code: 'XLM', type: 0 },
                        type: 'createPassiveSellOffer',
                    },
                ],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'manage sell offer operation',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.manageSellOffer({
                selling: nativeAsset,
                buying: credit4Asset,
                amount: '10',
                price: '1.25',
                offerId: '123456',
            });

            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [
                    {
                        amount: '100000000',
                        buying: {
                            code: 'USD',
                            issuer: 'GCNY5OXYSY4FKHOPT2SPOQZAOEIGXB5LBYW3HVU3OWSTQITS65M5RCNY',
                            type: 1,
                        },
                        offerId: '123456',
                        price: { d: 4, n: 5 },
                        selling: { code: 'XLM', type: 0 },
                        type: 'manageSellOffer',
                    },
                ],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'manage buy offer operation',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.manageBuyOffer({
                selling: credit4Asset,
                buying: nativeAsset,
                buyAmount: '10',
                price: '1.25',
                offerId: '123456',
            });

            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [
                    {
                        amount: '100000000',
                        buying: { code: 'XLM', type: 0 },
                        offerId: '123456',
                        price: { d: 4, n: 5 },
                        selling: {
                            code: 'USD',
                            issuer: 'GCNY5OXYSY4FKHOPT2SPOQZAOEIGXB5LBYW3HVU3OWSTQITS65M5RCNY',
                            type: 1,
                        },
                        type: 'manageBuyOffer',
                    },
                ],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'set options operation',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.setOptions({
                inflationDest: kp1.publicKey(),
                clearFlags: 8,
                setFlags: 1,
                masterWeight: 255,
                lowThreshold: 10,
                medThreshold: 20,
                highThreshold: 30,
                homeDomain: 'stellar.org',
                signer: {
                    ed25519PublicKey: kp2.publicKey(),
                    weight: 10,
                },
            });

            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [
                    {
                        clearFlags: 8,
                        highThreshold: 30,
                        homeDomain: 'stellar.org',
                        inflationDest: 'GC2GT6BHYJUKD7SVAKXVLBYBCELCHY577CAXJM5QNVLERDGFF37LR35K',
                        lowThreshold: 10,
                        masterWeight: 255,
                        medThreshold: 20,
                        setFlags: 1,
                        signer: {
                            key: '589092083e31dc531a2324b8abf0f4fc693f658a5592e0a55002a9e342b19755',
                            type: 0,
                            weight: 10,
                        },
                        type: 'setOptions',
                    },
                ],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'set options operation (empty body)',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.setOptions({});

            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [
                    {
                        clearFlags: undefined,
                        highThreshold: undefined,
                        homeDomain: undefined,
                        inflationDest: undefined,
                        lowThreshold: undefined,
                        masterWeight: undefined,
                        medThreshold: undefined,
                        setFlags: undefined,
                        signer: undefined,
                        type: 'setOptions',
                    },
                ],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'set options operation (ed25519 public key signer)',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.setOptions({
                signer: {
                    ed25519PublicKey: kp2.publicKey(),
                    weight: 10,
                },
            });

            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [
                    {
                        clearFlags: undefined,
                        highThreshold: undefined,
                        homeDomain: undefined,
                        inflationDest: undefined,
                        lowThreshold: undefined,
                        masterWeight: undefined,
                        medThreshold: undefined,
                        setFlags: undefined,
                        signer: {
                            key: '589092083e31dc531a2324b8abf0f4fc693f658a5592e0a55002a9e342b19755',
                            type: 0,
                            weight: 10,
                        },
                        type: 'setOptions',
                    },
                ],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'set options operation (pre auth tx signer)',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.setOptions({
                signer: {
                    preAuthTx: StrKey.decodePreAuthTx(
                        'TBMJBEQIHYY5YUY2EMSLRK7Q6T6GSP3FRJKZFYFFKABKTY2CWGLVKXVM',
                    ),
                    weight: 10,
                },
            });

            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [
                    {
                        clearFlags: undefined,
                        highThreshold: undefined,
                        homeDomain: undefined,
                        inflationDest: undefined,
                        lowThreshold: undefined,
                        masterWeight: undefined,
                        medThreshold: undefined,
                        setFlags: undefined,
                        signer: {
                            key: '589092083e31dc531a2324b8abf0f4fc693f658a5592e0a55002a9e342b19755',
                            type: 1,
                            weight: 10,
                        },
                        type: 'setOptions',
                    },
                ],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'set options operation (hashx signer)',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.setOptions({
                signer: {
                    sha256Hash: StrKey.decodeSha256Hash(
                        'XBMJBEQIHYY5YUY2EMSLRK7Q6T6GSP3FRJKZFYFFKABKTY2CWGLVLTQV',
                    ),
                    weight: 10,
                },
            });

            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [
                    {
                        clearFlags: undefined,
                        highThreshold: undefined,
                        homeDomain: undefined,
                        inflationDest: undefined,
                        lowThreshold: undefined,
                        masterWeight: undefined,
                        medThreshold: undefined,
                        setFlags: undefined,
                        signer: {
                            key: '589092083e31dc531a2324b8abf0f4fc693f658a5592e0a55002a9e342b19755',
                            type: 2,
                            weight: 10,
                        },
                        type: 'setOptions',
                    },
                ],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'change trust operation',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.changeTrust({
                asset: credit12Asset,
            });

            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [
                    {
                        limit: '9223372036854775807',
                        line: {
                            code: 'CATCOIN',
                            issuer: 'GDJVFDG5OCW5PYWHB64MGTHGFF57DRRJEDUEFDEL2SLNIOONHYJWHA3Z',
                            type: 2,
                        },
                        type: 'changeTrust',
                    },
                ],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'allow trust operation (authorized)',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.allowTrust({
                trustor: kp1.publicKey(),
                assetCode: 'USDC',
                authorize: true,
            });
            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [
                    {
                        assetCode: 'USDC',
                        assetType: 1,
                        authorize: 1,
                        trustor: 'GC2GT6BHYJUKD7SVAKXVLBYBCELCHY577CAXJM5QNVLERDGFF37LR35K',
                        type: 'allowTrust',
                    },
                ],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'allow trust operation (unauthorized)',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.allowTrust({
                trustor: kp1.publicKey(),
                assetCode: 'USDC',
                authorize: false,
            });
            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [
                    {
                        assetCode: 'USDC',
                        assetType: 1,
                        authorize: 0,
                        trustor: 'GC2GT6BHYJUKD7SVAKXVLBYBCELCHY577CAXJM5QNVLERDGFF37LR35K',
                        type: 'allowTrust',
                    },
                ],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'account merge operation',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.accountMerge({
                destination: kp1.publicKey(),
            });

            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [
                    {
                        destination: 'GC2GT6BHYJUKD7SVAKXVLBYBCELCHY577CAXJM5QNVLERDGFF37LR35K',
                        type: 'accountMerge',
                    },
                ],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'manage data operation (set data)',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.manageData({
                name: 'hello',
                value: 'world',
            });

            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [{ name: 'hello', type: 'manageData', value: '776f726c64' }],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'manage data operation (remove data)',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.manageData({
                name: 'hello',
                value: null,
            });

            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [{ name: 'hello', type: 'manageData', value: null }],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'bump sequence operation',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.bumpSequence({
                bumpTo: '200000000000000000',
            });

            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [{ bumpTo: '200000000000000000', type: 'bumpSequence' }],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'none memo',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.bumpSequence({
                bumpTo: '200000000000000000',
            });
            const memo = Memo.none();
            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                memo,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { type: 0 },
                operations: [{ bumpTo: '200000000000000000', type: 'bumpSequence' }],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'text memo',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.bumpSequence({
                bumpTo: '200000000000000000',
            });
            const memo = Memo.text('Hello, Stellar!');
            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                memo,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'Hello, Stellar!', type: 1 },
                operations: [{ bumpTo: '200000000000000000', type: 'bumpSequence' }],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'id memo',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.bumpSequence({
                bumpTo: '200000000000000000',
            });
            const memo = Memo.id('1234567890');
            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                memo,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { type: 2, id: '1234567890' },
                operations: [{ bumpTo: '200000000000000000', type: 'bumpSequence' }],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'hash memo',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.bumpSequence({
                bumpTo: '200000000000000000',
            });
            const memo = Memo.hash(
                '3389e9f0f1a65f19736cacf544c2e825313e8447f569233bb8db39aa607c8889',
            );
            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                memo,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: {
                    type: 3,
                    hash: '3389e9f0f1a65f19736cacf544c2e825313e8447f569233bb8db39aa607c8889',
                },
                operations: [{ bumpTo: '200000000000000000', type: 'bumpSequence' }],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'hash return memo',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.bumpSequence({
                bumpTo: '200000000000000000',
            });
            const memo = Memo.return(
                '3389e9f0f1a65f19736cacf544c2e825313e8447f569233bb8db39aa607c8889',
            );
            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                memo,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: {
                    type: 4,
                    hash: '3389e9f0f1a65f19736cacf544c2e825313e8447f569233bb8db39aa607c8889',
                },
                operations: [{ bumpTo: '200000000000000000', type: 'bumpSequence' }],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'base fee (500 stroops)',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.bumpSequence({
                bumpTo: '200000000000000000',
            });

            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                500,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 500,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [{ bumpTo: '200000000000000000', type: 'bumpSequence' }],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'network (testnet)',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.bumpSequence({
                bumpTo: '200000000000000000',
            });

            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                Networks.TESTNET,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Test SDF Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [{ bumpTo: '200000000000000000', type: 'bumpSequence' }],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: "path (m/44'/148'/1')",
        path: "m/44'/148'/1'",
        tx: (() => {
            const op = Operation.bumpSequence({
                bumpTo: '200000000000000000',
            });

            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/1'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [{ bumpTo: '200000000000000000', type: 'bumpSequence' }],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'multiple operations',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op0 = Operation.createAccount({
                destination: kp1.publicKey(),
                startingBalance: '123.456789',
            });
            const op1 = Operation.payment({
                destination: kp1.publicKey(),
                asset: credit4Asset,
                amount: '10000',
            });
            const op2 = Operation.payment({
                destination: kp2.publicKey(),
                asset: credit12Asset,
                amount: '5000000',
            });
            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op0,
                op1,
                op2,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 300,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [
                    {
                        destination: 'GC2GT6BHYJUKD7SVAKXVLBYBCELCHY577CAXJM5QNVLERDGFF37LR35K',
                        startingBalance: '1234567890',
                        type: 'createAccount',
                    },
                    {
                        amount: '100000000000',
                        asset: {
                            code: 'USD',
                            issuer: 'GCNY5OXYSY4FKHOPT2SPOQZAOEIGXB5LBYW3HVU3OWSTQITS65M5RCNY',
                            type: 1,
                        },
                        destination: 'GC2GT6BHYJUKD7SVAKXVLBYBCELCHY577CAXJM5QNVLERDGFF37LR35K',
                        type: 'payment',
                    },
                    {
                        amount: '50000000000000',
                        asset: {
                            code: 'CATCOIN',
                            issuer: 'GDJVFDG5OCW5PYWHB64MGTHGFF57DRRJEDUEFDEL2SLNIOONHYJWHA3Z',
                            type: 2,
                        },
                        destination: 'GBMJBEQIHYY5YUY2EMSLRK7Q6T6GSP3FRJKZFYFFKABKTY2CWGLVLKH5',
                        type: 'payment',
                    },
                ],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
    {
        description: 'operation source',
        path: "m/44'/148'/0'",
        tx: (() => {
            const op = Operation.bumpSequence({
                bumpTo: '200000000000000000',
                source: kp0.publicKey(),
            });

            return build_tx(
                DEFAULT_SOURCE,
                DEFAULT_SEQUENCE,
                DEFAULT_FEE,
                DEFAULT_NETWORK,
                DEFAULT_TIMEBOUNDS,
                DEFAULT_MEMO,
                op,
            );
        })(),
        result: {
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            path: "m/44'/148'/0'",
            transaction: {
                fee: 100,
                memo: { text: 'trezor stellar', type: 1 },
                operations: [
                    {
                        bumpTo: '200000000000000000',
                        source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                        type: 'bumpSequence',
                    },
                ],
                sequence: '103420918407103889',
                source: 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH',
                timebounds: { maxTime: 1700000000, minTime: 1600000000 },
            },
        },
    },
];
