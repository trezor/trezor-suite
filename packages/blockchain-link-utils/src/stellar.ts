import type { TokenDetailByMint, Transaction } from '@trezor/blockchain-link-types';
import { isCodesignBuild } from '@trezor/env-utils';
import { STELLAR_DECIMALS } from '@trezor/network-stellar/constants';
import type { IdentifiedTransaction } from '@trezor/network-stellar/types';

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
        default: {
            if (descriptor !== parsed.fromAddress && descriptor !== parsed.toAddress)
                // Transaction does not involve the user's address
                return { ...baseTx, type: 'unknown' };
        }
    }

    const { fromAddress, toAddress } = parsed;

    const type = descriptor === fromAddress ? 'sent' : 'recv';

    if (parsed.type === 'payment-token') {
        const { assetCode, assetIssuer, amount } = parsed.tokenInfo;
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
                    amount,
                },
            ],
        };
    } else {
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
    }
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
