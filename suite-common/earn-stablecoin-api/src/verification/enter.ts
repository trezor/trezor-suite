import { Verifier } from '@suite-common/calldata';
import { type EvmHexString, evmHexString } from '@suite-common/schemas/src/evm';
import { BigNumber } from '@trezor/utils';

import { parseUnsignedEvmTransaction } from './schema';
import {
    type TransactionVerificationStatus,
    type VerificationStatus,
    aggregateStatuses,
    toStatus,
} from './shared';
import {
    type EnterYield200,
    type TransactionDto,
    TransactionDtoStatus,
    TransactionDtoType,
} from '../api/types';

type VerifyEnterTransactionsParams = {
    address: string;
    amount: string;
    decimals: number;
};

const verifyApproval = (
    calldata: EvmHexString,
    spender: EvmHexString,
    amount: bigint,
): TransactionVerificationStatus =>
    toStatus(Verifier.evm.erc20.approve(calldata, { spender, amount }).isValid);

const verifySupply = (
    calldata: EvmHexString,
    to: EvmHexString,
    vaultAddress: EvmHexString,
    receiver: EvmHexString,
    assets: bigint,
): TransactionVerificationStatus => {
    if (to.toLowerCase() !== vaultAddress.toLowerCase()) return 'failed';

    return toStatus(Verifier.evm.erc4626.deposit(calldata, { assets, receiver }).isValid);
};

const getTransactionStatus = (
    tx: TransactionDto,
    vaultAddress: EvmHexString,
    address: EvmHexString,
    amountBigInt: bigint,
): TransactionVerificationStatus => {
    if (tx.status === TransactionDtoStatus.SKIPPED) return 'skipped';

    const parsed = parseUnsignedEvmTransaction(tx.unsignedTransaction);

    if (!parsed) return 'failed';

    switch (tx.type) {
        case TransactionDtoType.APPROVAL:
            return verifyApproval(parsed.data, vaultAddress, amountBigInt);
        case TransactionDtoType.SUPPLY:
        case TransactionDtoType.DEPOSIT:
            return verifySupply(parsed.data, parsed.to, vaultAddress, address, amountBigInt);
        default:
            return 'skipped';
    }
};

export const verifyEnterTransactions = (
    { transactions, vaultAddress }: Pick<EnterYield200, 'transactions' | 'vaultAddress'>,
    { address, amount, decimals }: VerifyEnterTransactionsParams,
): VerificationStatus => {
    const amountBigInt = BigInt(
        new BigNumber(amount).times(new BigNumber(10).pow(decimals)).toFixed(0),
    );

    const parsedVaultAddress = evmHexString.safeParse(vaultAddress);
    const parsedAddress = evmHexString.safeParse(address);

    if (!parsedVaultAddress.success || !parsedAddress.success) {
        return 'failure';
    }

    const statuses = transactions.map(tx =>
        getTransactionStatus(tx, parsedVaultAddress.data, parsedAddress.data, amountBigInt),
    );

    return aggregateStatuses(statuses);
};
