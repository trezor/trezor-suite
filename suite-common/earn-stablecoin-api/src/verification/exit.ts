import { Verifier } from '@suite-common/calldata';
import { type EvmHexString, evmHexString } from '@suite-common/schemas/src/evm';

import { parseUnsignedEvmTransaction } from './schema';
import {
    type TransactionVerificationStatus,
    type VerificationStatus,
    aggregateStatuses,
    toStatus,
} from './shared';
import { type ExitYield200, type TransactionDto, TransactionDtoType } from '../api/types';

type VerifyExitTransactionsParams = {
    address: string;
};

const verifyRedeem = (
    calldata: EvmHexString,
    to: EvmHexString,
    vaultAddress: EvmHexString,
    address: EvmHexString,
): TransactionVerificationStatus => {
    if (to.toLowerCase() !== vaultAddress.toLowerCase()) return 'failed';

    const result = Verifier.evm.erc4626.redeem(
        calldata,
        {
            shares: 0n,
            receiver: address,
            owner: address,
        },
        ['receiver', 'owner'],
    );

    return toStatus(result.isValid);
};

const getTransactionStatus = (
    tx: TransactionDto,
    vaultAddress: EvmHexString,
    address: EvmHexString,
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
    { transactions, vaultAddress }: Pick<ExitYield200, 'transactions' | 'vaultAddress'>,
    { address }: VerifyExitTransactionsParams,
): VerificationStatus => {
    const parsedVaultAddress = evmHexString.safeParse(vaultAddress);
    const parsedAddress = evmHexString.safeParse(address);

    if (!parsedVaultAddress.success || !parsedAddress.success) {
        return 'failure';
    }

    const statuses = transactions.map(tx =>
        getTransactionStatus(tx, parsedVaultAddress.data, parsedAddress.data),
    );

    return aggregateStatuses(statuses);
};
