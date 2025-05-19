import {
    Account,
    Asset,
    Horizon,
    Memo,
    Networks,
    Operation,
    Transaction as StellarTransaction,
    TransactionBuilder,
    extractBaseAddress,
} from '@stellar/stellar-sdk';

import type { Target, Transaction, TransactionDetail } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils/src/bigNumber';

export const STELLAR_DECIMALS = 7;

export const toStroops = (value: string) => {
    const multiplier = new BigNumber(10).pow(STELLAR_DECIMALS);
    const amount = new BigNumber(value).times(multiplier);

    return amount;
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
    descriptor?: string,
): Transaction => {
    // In Stellar, there are many types of operations; currently, we only include limited support and will consider adding more support later.
    const parsedTx = new StellarTransaction(rawTx.envelope_xdr, Networks.PUBLIC);

    const tx: Transaction = {
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
        },
    };

    if (!rawTx.successful) {
        // If the transaction is not successful, we can set the type to 'failed' and return early
        return { ...tx, type: 'failed' };
    }

    if (parsedTx.operations.length !== 1) {
        // If the transaction has more than one operation, we consider it as a unknown type
        return tx;
    }

    const rawOp = parsedTx.operations[0];
    const opSource = rawOp.source || rawTx.source_account;

    const params = {
        fromAddress: extractBaseAddress(opSource),
        toAddress: '',
        amount: '',
    };

    switch (rawOp.type) {
        case 'createAccount': {
            params.toAddress = extractBaseAddress(rawOp.destination);
            params.amount = toStroops(rawOp.startingBalance).toString();
            break;
        }
        case 'payment': {
            if (!rawOp.asset.isNative()) {
                // If the asset is not native (XLM), we consider it as a unknown type
                return tx;
            }

            params.toAddress = extractBaseAddress(rawOp.destination);
            params.amount = toStroops(rawOp.amount).toString();
            break;
        }
        default: {
            // We only support createAccount and payment operations for now, so we consider it as a unknown type
            return tx;
        }
    }

    if (descriptor !== params.fromAddress && descriptor !== params.toAddress) {
        // If the send and receive addresses do not match the descriptor, we consider it as a unknown type
        return tx;
    }

    const targets: Target[] = [
        {
            n: 0,
            addresses: [params.toAddress],
            isAddress: true,
            amount: params.amount,
        },
    ];

    const details: TransactionDetail = {
        vin: [
            {
                n: 0,
                addresses: [params.fromAddress],
                isAddress: true,
                value: params.amount,
            },
        ],
        vout: [
            {
                n: 0,
                addresses: [params.toAddress],
                isAddress: true,
                value: params.amount,
            },
        ],
        size: 0,
        totalInput: params.amount,
        totalOutput: params.amount,
    };

    const type = descriptor === params.fromAddress ? 'sent' : 'recv';

    return { ...tx, amount: params.amount, details, targets, type };
};

export const buildSendTransaction = (
    descriptor: string,
    sequence: string,
    fee: string,
    destinationActivated: boolean,
    destination: string,
    amount: string,
    destinationTag?: string,
    isTestnet = false,
) => {
    const source = new Account(descriptor, sequence);

    const txBuilder = new TransactionBuilder(source, {
        fee,
        networkPassphrase: isTestnet ? Networks.TESTNET : Networks.PUBLIC,
    }).setTimebounds(0, 0);

    if (destinationTag) {
        txBuilder.addMemo(Memo.text(destinationTag));
    }

    if (destinationActivated) {
        txBuilder.addOperation(
            Operation.payment({
                destination,
                amount,
                asset: Asset.native(),
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
