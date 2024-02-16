/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
// @ts-ignore
import commonFixtures from '../../../../submodules/trezor-common/tests/fixtures/stellar/sign_tx.json';
import { Messages } from '@trezor/transport/lib';

// operations are in protobuf format (snake_case)

const transformAsset = (asset: any) => ({
    type: Messages.StellarAssetType[asset.type],
    code: asset.code,
    issuer: asset.issuer,
});

const transformOperation = (op: any) => {
    switch (op._message_type) {
        case 'StellarBumpSequenceOp':
            return {
                type: 'bumpSequence',
                bumpTo: op.bump_to,
            };
        case 'StellarAccountMergeOp':
            return {
                type: 'accountMerge',
                destination: op.destination_account,
            };
        case 'StellarCreateAccountOp':
            return {
                type: 'createAccount',
                destination: op.new_account,
                startingBalance: op.starting_balance.toString(),
            };
        case 'StellarPaymentOp':
            return {
                type: 'payment',
                source: op.source_account,
                destination: op.destination_account,
                asset: transformAsset(op.asset),
                amount: op.amount.toString(),
            };
        case 'StellarAllowTrustOp':
            return {
                type: 'allowTrust',
                trustor: op.trusted_account,
                assetType: transformAsset({ type: op.asset_type }).type,
                assetCode: op.asset_code,
                authorize: op.is_authorized,
            };
        case 'StellarChangeTrustOp':
            return {
                type: 'changeTrust',
                line: transformAsset(op.asset),
                limit: op.limit.toString(),
            };
        case 'StellarCreatePassiveSellOfferOp':
            return {
                type: 'createPassiveSellOffer',
                source: op.source_account,
                buying: transformAsset(op.buying_asset),
                selling: transformAsset(op.selling_asset),
                amount: op.amount.toString(),
                price: { n: op.price_n, d: op.price_d },
            };
        case 'StellarManageSellOfferOp':
            return {
                type: 'manageSellOffer',
                source: op.source_account,
                buying: transformAsset(op.buying_asset),
                selling: transformAsset(op.selling_asset),
                amount: op.amount.toString(),
                offerId: op.offer_id,
                price: { n: op.price_n, d: op.price_d },
            };
        case 'StellarManageBuyOfferOp':
            return {
                type: 'manageBuyOffer',
                source: op.source_account,
                buying: transformAsset(op.buying_asset),
                selling: transformAsset(op.selling_asset),
                amount: op.amount.toString(),
                offerId: op.offer_id,
                price: { n: op.price_n, d: op.price_d },
            };
        case 'StellarPathPaymentStrictReceiveOp':
            return {
                type: 'pathPaymentStrictReceive',
                source: op.source_account,
                sendAsset: transformAsset(op.send_asset),
                sendMax: op.send_max,
                destination: op.destination_account,
                destAsset: transformAsset(op.destination_asset),
                destAmount: op.destination_amount.toString(),
                path: op.paths,
            };
        case 'StellarPathPaymentStrictSendOp':
            return {
                type: 'pathPaymentStrictSend',
                source: op.source_account,
                sendAsset: transformAsset(op.send_asset),
                sendAmount: op.send_amount,
                destination: op.destination_account,
                destAsset: transformAsset(op.destination_asset),
                destMin: op.destination_min.toString(),
                path: op.paths,
            };
        case 'StellarManageDataOp':
            return {
                type: 'manageData',
                source: op.source_account,
                name: op.key,
                value: op.value,
            };
        case 'StellarSetOptionsOp':
            return {
                type: 'setOptions',
                source: op.source_account,
                clearFlags: op.clear_flags,
                setFlags: op.set_flags,
                masterWeight: op.master_weight,
                lowThreshold: op.low_threshold,
                medThreshold: op.medium_threshold,
                highThreshold: op.high_threshold,
                homeDomain: op.home_domain,
                inflationDest: op.inflation_destination_account,
                signer: {
                    type: Messages.StellarSignerType[op.signer_type],
                    key: op.signer_key,
                    weight: op.signer_weight,
                },
            };
        case 'StellarClaimClaimableBalanceOp':
            return {
                type: 'claimClaimableBalance',
                source: op.source_account,
                balanceId: op.balance_id,
            };
        default:
            return [];
    }
};

const legacyResults = [
    {
        rules: ['<2.4.3'],
        payload: false,
    },
];

const legacyResultsMap: Record<string, LegacyResult[]> = {
    // newly added message in 2.4.3
    StellarManageBuyOfferOp: legacyResults,
    // newly added message in 2.4.3
    StellarPathPaymentStrictSendOp: legacyResults,
    'timebounds-0-0': [
        {
            rules: ['<2.4.3'],
            payload: {
                publicKey: '2f22b9c62f08b774f3ebe6dd6e7db93c3ec2cbde0279561a3d9c5225b8c32292',
                // signature is different in 2.4.2 from what we get from 2-main
                signature:
                    '864eb69e7ecb30b0a27112742716ccfedf38167a78ffdb1890bd4d473f2ab4850f3e6e5523d88dfad7b7b308369406d69abb9ecaf8dfb7a87ed4e8b57bfc2201',
            },
        },
        {
            rules: ['<2.3.0'],
            payload: false,
        },
    ],
};

export default {
    method: 'stellarSignTransaction',
    setup: {
        mnemonic: commonFixtures.setup.mnemonic,
    },
    tests: [
        ...commonFixtures.tests.map(({ name, parameters, result }) => ({
            description: name,
            params: {
                path: parameters.address_n,
                networkPassphrase: parameters.network_passphrase,
                transaction: {
                    source: parameters.tx.source_account,
                    fee: parameters.tx.fee,
                    sequence: parameters.tx.sequence_number,
                    timebounds: {
                        minTime: parameters.tx.timebounds_start,
                        maxTime: parameters.tx.timebounds_end,
                    },
                    memo: {
                        // @ts-expect-error
                        type: Messages.StellarMemoType[parameters.tx.memo_type],
                        text: parameters.tx.memo_text,
                        id: parameters.tx.memo_id,
                        hash: parameters.tx.memo_hash,
                    },
                    operations: parameters.operations.flatMap(transformOperation),
                },
            },
            result: {
                publicKey: result.public_key,
                signature: Buffer.from(result.signature, 'base64').toString('hex'),
            },
            legacyResults: legacyResultsMap[name]
                ? legacyResultsMap[name]
                : [
                      {
                          // stellar has required update
                          rules: ['<2.3.0'],
                          payload: false,
                      },
                  ],
        })),
        {
            description: 'Sequence is over Number.MAX_SAFE_INTEGER and is sent as string',
            setup: {
                mnemonic:
                    'bridge endless life will season cigar crash relief give syrup annual inner',
            },
            params: {
                path: "m/44'/148'/0'",
                networkPassphrase: 'Public Global Stellar Network ; September 2015',
                transaction: {
                    source: 'GDIO5QKU6PBJ6OCML6XCU3EBG4LINOVXPMNJJFMAWXDZIKMGJP7JH2UL',
                    fee: 100,
                    sequence: '166054873161269249',
                    memo: {
                        type: 0,
                    },
                    timebounds: {
                        minTime: 0,
                        maxTime: 1639135778,
                    },
                    operations: [
                        {
                            type: 'manageData',
                            name: 'hello',
                        },
                    ],
                },
            },
            result: {
                signature: Buffer.from(
                    'Xwqw6xRo2pP7mUE4ybQxvYy7T4tYHq8YuoIlZ5UqnyM70+8PIf/wKFGzFY2kBVCoScYQlBzR9lopH3VoHiL+DA==',
                    'base64',
                ).toString('hex'),
            },
            legacyResults: [
                {
                    // stellar has required update
                    rules: ['<2.3.0'],
                    payload: false,
                },
            ],
        },
    ],
};
