import { Verifier, asEvmAddress } from '@suite-common/calldata';

import { type ExitYieldResponseSuccess, TransactionDtoType } from '../api';
import { parseUnsignedEvmTransaction } from './schema';
import {
    type TransactionVerificationStatus,
    type VerificationStatus,
    aggregateStatuses,
    toStatus,
} from './shared';
import { EVM_VAULT_ADDRESSES } from '../constants/vaults';

type VerifyExitTransactionsParams = {
    yieldId: string;
    address: string;
};

const verifyRedeem = (
    calldata: `0x${string}`,
    to: `0x${string}`,
    vaultAddress: `0x${string}`,
    address: string,
): TransactionVerificationStatus => {
    if (to.toLowerCase() !== vaultAddress.toLowerCase()) return 'failed';

    const result = Verifier.evm.erc4626.redeem(
        calldata,
        {
            shares: 0n,
            receiver: asEvmAddress(address),
            owner: asEvmAddress(address),
        },
        ['receiver', 'owner'],
    );

    return toStatus(result.isValid);
};

const getTransactionStatus = (
    tx: ExitYieldResponseSuccess['data']['transactions'][number],
    vaultAddress: `0x${string}`,
    address: string,
): TransactionVerificationStatus => {
    const parsed = parseUnsignedEvmTransaction(tx.unsignedTransaction);

    if (!parsed) return 'failed';

    switch (tx.type) {
        case TransactionDtoType.WITHDRAW:
            return verifyRedeem(parsed.data, parsed.to, vaultAddress, address);
        default:
            return 'skipped';
    }
};

export const verifyExitTransactions = (
    response: ExitYieldResponseSuccess,
    { yieldId, address }: VerifyExitTransactionsParams,
): VerificationStatus => {
    const vaultAddress = EVM_VAULT_ADDRESSES[yieldId];

    if (!vaultAddress) {
        console.error(
            new Error(`Yield with id ${yieldId} does not have a corresponding vault address`),
        );

        return 'failure';
    }

    const statuses = response.data.transactions.map(tx =>
        getTransactionStatus(tx, vaultAddress, address),
    );

    return aggregateStatuses(statuses);
};
