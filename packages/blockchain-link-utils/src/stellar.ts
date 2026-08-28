import type { TokenDetailByMint, Transaction } from '@trezor/blockchain-link-types';
import { isCodesignBuild } from '@trezor/env-utils';
import { STELLAR_DECIMALS } from '@trezor/network-stellar/constants';
import type { IdentifiedTransaction, TokenTransferInfo } from '@trezor/network-stellar/types';

/**
 * One host-function operation can move several assets at once, so only the transfers the
 * account takes part in are kept — the rest belong to other participants of the same call.
 */
const transformTokenTransfers = (
    baseTx: Omit<Transaction, 'type'>,
    transfers: readonly TokenTransferInfo[],
    descriptor: string,
    tokenDetailByMint: TokenDetailByMint,
): Transaction => {
    const ownTransfers = transfers.filter(
        ({ fromAddress, toAddress }) => descriptor === fromAddress || descriptor === toAddress,
    );

    if (ownTransfers.length === 0) {
        return { ...baseTx, type: 'unknown' };
    }

    const isSender = ownTransfers.some(({ fromAddress }) => descriptor === fromAddress);
    const isRecipient = ownTransfers.some(({ toAddress }) => descriptor === toAddress);

    let type: 'self' | 'sent' | 'recv' = 'recv';
    if (isSender) {
        type = isRecipient ? 'self' : 'sent';
    }

    return {
        ...baseTx,
        type,
        amount: '0', // No native amount for token transfers
        tokens: ownTransfers.map(({ assetCode, assetIssuer, amount, fromAddress, toAddress }) => {
            const contract = `${assetCode}-${assetIssuer}`;

            return {
                type: descriptor === fromAddress ? 'sent' : 'recv',
                standard: 'STELLAR-CLASSIC',
                from: fromAddress,
                to: toAddress,
                contract,
                name: tokenDetailByMint[contract]?.name || assetCode,
                symbol: assetCode,
                decimals: STELLAR_DECIMALS,
                amount,
            };
        }),
    };
};

export const transformTransaction = (
    identifiedTx: IdentifiedTransaction,
    descriptor: string,
    tokenDetailByMint: TokenDetailByMint,
): Transaction => {
    const { memo, feeSource, hash, fee, createdAt, ledgerAttr, ...parsed } = identifiedTx;

    const baseTx: Omit<Transaction, 'type'> = {
        txid: hash,
        amount: '0',
        fee,
        blockTime: createdAt,
        blockHeight: ledgerAttr,
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
        stellarSpecific: { memo, feeSource },
    };

    switch (parsed.type) {
        case 'unknown':
            return { ...baseTx, type: 'unknown' };
        case 'failed':
            return { ...baseTx, type: 'failed' };
        case 'change-trust':
            return descriptor !== parsed.fromAddress
                ? { ...baseTx, type: 'unknown' }
                : {
                      ...baseTx,
                      type: 'self',
                      stellarSpecific: {
                          ...baseTx.stellarSpecific!,
                          operationType: 'changeTrust',
                          changeTrust: { assetCode: parsed.assetCode, isRemoval: parsed.isRemoval },
                      },
                  };
        case 'token-transfer':
            return transformTokenTransfers(baseTx, parsed.transfers, descriptor, tokenDetailByMint);
        default: {
            if (descriptor !== parsed.fromAddress && descriptor !== parsed.toAddress)
                // Transaction does not involve the user's address
                return { ...baseTx, type: 'unknown' };
        }
    }

    const { fromAddress, toAddress } = parsed;

    const type = descriptor === fromAddress ? 'sent' : 'recv';

    // Native asset transfer
    const nativeAmount = parsed.amount.toString();

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
};

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
