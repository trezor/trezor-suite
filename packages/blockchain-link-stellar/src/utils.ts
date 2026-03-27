import {
    Account,
    Asset,
    type Horizon,
    Memo,
    Networks,
    Operation,
    Transaction as StellarSdkTransaction,
    StrKey,
    TransactionBuilder,
    extractBaseAddress,
} from '@stellar/stellar-sdk';

import { isCodesignBuild } from '@trezor/env-utils';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import type { StellarTransaction, TokenDetailByMint } from './types';

// copy paste from protobuf to avoid extra dependency
export type StellarAsset = {
    type: 0 | 1 | 2 | 'NATIVE' | 'ALPHANUM4' | 'ALPHANUM12';
    code?: string;
    issuer?: string;
};

export const STELLAR_DECIMALS = 7;

export const toStroops = (value: string) => {
    const multiplier = new BigNumber(10).pow(STELLAR_DECIMALS);
    const amount = new BigNumber(value).times(multiplier);

    return amount;
};

export const BASE_INFO = {
    BASE_RESERVE: toStroops('0.5'), // 0.5 XLM, https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/accounts#base-reserves
    MINIMUM_RESERVE: toStroops('1'), // 1 XLM
};

const isoToTimestamp = (isoDate: string): number => {
    const timestamp = Date.parse(isoDate);

    if (isNaN(timestamp)) {
        throw new Error('Invalid ISO date string');
    }

    return Math.floor(timestamp / 1000);
};

const convertMemo = (memo: Memo): string | undefined => {
    switch (memo.type) {
        case 'text':
        case 'id':
            return memo.value?.toString();
        case 'hash':
        case 'return':
            return memo.value?.toString('hex');
        default:
            return undefined;
    }
};

export const transformTransaction = (
    rawTx: Horizon.ServerApi.TransactionRecord,
    descriptor: string,
    tokenDetailByMint: TokenDetailByMint,
): StellarTransaction => {
    // In Stellar, there are many types of operations; currently, we only include limited support and will consider adding more support later.
    const parsedTx = new StellarSdkTransaction(rawTx.envelope_xdr, Networks.PUBLIC);

    const baseTx: StellarTransaction = {
        type: 'unknown', // default type
        txid: rawTx.hash,
        amount: '0',
        fee: rawTx.fee_charged.toString(),
        blockTime: isoToTimestamp(rawTx.created_at),
        blockHeight: rawTx.ledger_attr,
        targets: [],
        tokens: [],
        internalTransfers: [],
        feeRate: undefined,
        details: {
            vin: [],
            vout: [],
            size: 0,
            totalInput: '0',
            totalOutput: '0',
        },
        stellarSpecific: {
            memo: convertMemo(parsedTx.memo),
            feeSource: extractBaseAddress(rawTx.source_account),
        },
    };

    if (!rawTx.successful) {
        // If the transaction is not successful, we can set the type to 'failed' and return early
        return { ...baseTx, type: 'failed' };
    }

    if (parsedTx.operations.length !== 1) {
        // If the transaction has more than one operation, we consider it as a unknown type
        return baseTx;
    }

    const rawOp = parsedTx.operations[0];
    const opSource = rawOp.source || rawTx.source_account;
    const fromAddress = extractBaseAddress(opSource);

    let toAddress: string | undefined;
    let nativeAmount: string | undefined;
    let isTokenTransfer = false;
    let tokenInfo: { assetCode: string; assetIssuer: string; amount: string } | undefined;

    switch (rawOp.type) {
        case 'createAccount':
            toAddress = extractBaseAddress(rawOp.destination);
            nativeAmount = toStroops(rawOp.startingBalance).toString();
            break;
        case 'payment':
            toAddress = extractBaseAddress(rawOp.destination);
            if (rawOp.asset.isNative()) {
                nativeAmount = toStroops(rawOp.amount).toString();
            } else {
                isTokenTransfer = true;
                tokenInfo = {
                    assetCode: rawOp.asset.getCode(),
                    assetIssuer: rawOp.asset.getIssuer(),
                    amount: toStroops(rawOp.amount).toString(),
                };
                // For token transfers, the native amount is 0
                nativeAmount = '0';
            }
            break;
        case 'changeTrust': {
            // Only support regular assets, not liquidity pool shares
            if (
                rawOp.line.getAssetType() !== 'credit_alphanum4' &&
                rawOp.line.getAssetType() !== 'credit_alphanum12'
            ) {
                return baseTx;
            }

            if (descriptor !== fromAddress) {
                return baseTx;
            }

            const line = rawOp.line as Asset;
            const assetCode = line.getCode();
            const isRemoval = new BigNumber(rawOp.limit).isZero();

            return {
                ...baseTx,
                type: 'self',
                stellarSpecific: {
                    ...baseTx.stellarSpecific!,
                    operationType: 'changeTrust',
                    changeTrust: {
                        assetCode,
                        isRemoval,
                    },
                },
            };
        }
        default:
            // We only support createAccount and payment operations for now, so we consider it as a unknown type
            return baseTx;
    }

    if (!toAddress) {
        // Should not happen if operation is supported, but as a safeguard.
        return baseTx;
    }

    const isFrom = descriptor === fromAddress;
    const isTo = descriptor === toAddress;

    if (!descriptor || (!isFrom && !isTo)) {
        // Transaction does not involve the user's address
        return baseTx;
    }

    const type = isFrom ? 'sent' : 'recv';

    if (isTokenTransfer && tokenInfo) {
        const { assetCode, assetIssuer, amount: tokenAmount } = tokenInfo;
        const contract = `${assetCode}-${assetIssuer}`;

        return {
            ...baseTx,
            type,
            amount: '0', // No native amount for token transfers
            tokens: [
                {
                    type,
                    standard: 'STELLAR-CLASSIC',
                    from: fromAddress,
                    to: toAddress,
                    contract,
                    name: tokenDetailByMint[contract]?.name || assetCode,
                    symbol: assetCode,
                    decimals: STELLAR_DECIMALS,
                    amount: tokenAmount,
                },
            ],
        };
    }

    if (nativeAmount) {
        // Native asset transfer
        return {
            ...baseTx,
            type,
            amount: nativeAmount,
            targets: [
                {
                    n: 0,
                    addresses: [toAddress],
                    isAddress: true,
                    amount: nativeAmount,
                },
            ],
            details: {
                vin: [
                    {
                        n: 0,
                        addresses: [fromAddress],
                        isAddress: true,
                        value: nativeAmount,
                    },
                ],
                vout: [
                    {
                        n: 0,
                        addresses: [toAddress],
                        isAddress: true,
                        value: nativeAmount,
                    },
                ],
                size: 0,
                totalInput: nativeAmount,
                totalOutput: nativeAmount,
            },
        };
    }

    return baseTx;
};

type CreateTransactionBuilderParams = {
    descriptor: string;
    sequence: string;
    fee: string;
    isTestnet?: boolean;
};

const createTransactionBuilder = ({
    descriptor,
    sequence,
    fee,
    isTestnet = false,
}: CreateTransactionBuilderParams) => {
    const source = new Account(descriptor, sequence);

    return new TransactionBuilder(source, {
        fee,
        networkPassphrase: isTestnet ? Networks.TESTNET : Networks.PUBLIC,
    }).setTimebounds(0, 0);
};

type BuildTrustlineTransactionParams = CreateTransactionBuilderParams & {
    asset: StellarAsset;
    limit?: string;
};

const buildTrustlineTransaction = ({
    descriptor,
    sequence,
    fee,
    asset,
    limit,
    isTestnet,
}: BuildTrustlineTransactionParams) => {
    const txBuilder = createTransactionBuilder({ descriptor, sequence, fee, isTestnet });

    txBuilder.addOperation(
        Operation.changeTrust({
            asset: new Asset(asset.code!, asset.issuer),
            limit, // If limit is '0', it removes the trustline
        }),
    );

    return txBuilder.build();
};

type BuildSendTransactionParams = CreateTransactionBuilderParams & {
    destinationActivated: boolean;
    destination: string;
    amount: string;
    asset: StellarAsset;
    destinationTag?: string;
};

export const buildSendTransaction = ({
    descriptor,
    sequence,
    fee,
    destinationActivated,
    destination,
    amount,
    asset,
    destinationTag,
    isTestnet,
}: BuildSendTransactionParams) => {
    const txBuilder = createTransactionBuilder({ descriptor, sequence, fee, isTestnet });

    if (destinationTag) {
        txBuilder.addMemo(Memo.text(destinationTag));
    }

    if (destinationActivated) {
        txBuilder.addOperation(
            Operation.payment({
                destination,
                amount,
                asset: new Asset(asset.code || 'XLM', asset.issuer),
            }),
        );
    } else {
        txBuilder.addOperation(
            Operation.createAccount({
                destination,
                startingBalance: amount,
            }),
        );
    }

    return txBuilder.build();
};

type BuildTrustlineParams = Omit<BuildTrustlineTransactionParams, 'limit'>;

export const buildAddTrustlineTransaction = ({
    descriptor,
    sequence,
    fee,
    asset,
    isTestnet,
}: BuildTrustlineParams) =>
    buildTrustlineTransaction({ descriptor, sequence, fee, asset, isTestnet });

export const buildRemoveTrustlineTransaction = ({
    descriptor,
    sequence,
    fee,
    asset,
    isTestnet,
}: BuildTrustlineParams) =>
    buildTrustlineTransaction({ descriptor, sequence, fee, asset, limit: '0', isTestnet });

export const getTokenMetadata = async (): Promise<TokenDetailByMint> => {
    const env = isCodesignBuild() ? 'stable' : 'develop';

    const response = await fetch(
        `https://data.trezor.io/suite/definitions/${env}/stellar.advanced.coin.definitions.v1.json`,
    );

    if (!response.ok) {
        throw Error(`Failed to fetch token metadata: ${response.statusText}`);
    }

    const data: TokenDetailByMint = await response.json();

    return data;
};

export const isValidAssetCode = (code: string): boolean => /^[a-zA-Z0-9]{1,12}$/.test(code);

export const isValidAddress = (address: string): boolean => StrKey.isValidEd25519PublicKey(address);
