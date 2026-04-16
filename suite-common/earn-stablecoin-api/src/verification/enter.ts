import { Verifier, asEvmAddress } from '@suite-common/calldata';
import { BigNumber } from '@trezor/utils';

import { type EnterYieldResponseSuccess, TransactionDtoType } from '../api';
import { parseUnsignedEvmTransaction } from './schema';
import {
    type TransactionVerificationStatus,
    type VerificationStatus,
    aggregateStatuses,
    toStatus,
} from './shared';
import { EVM_VAULT_ADDRESSES } from '../constants/vaults';

type VerifyEnterTransactionsParams = {
    yieldId: string;
    address: string;
    amount: string;
    decimals: number;
};

const verifyApproval = (
    calldata: `0x${string}`,
    spender: `0x${string}`,
    amount: bigint,
): TransactionVerificationStatus =>
    toStatus(Verifier.evm.erc20.approve(calldata, { spender, amount }).isValid);

const verifySupply = (
    calldata: `0x${string}`,
    to: `0x${string}`,
    vaultAddress: `0x${string}`,
    receiver: `0x${string}`,
    assets: bigint,
): TransactionVerificationStatus => {
    if (to.toLowerCase() !== vaultAddress.toLowerCase()) return 'failed';

    return toStatus(Verifier.evm.erc4626.deposit(calldata, { assets, receiver }).isValid);
};

const getTransactionStatus = (
    tx: EnterYieldResponseSuccess['data']['transactions'][number],
    vaultAddress: `0x${string}` | undefined,
    address: `0x${string}`,
    amountBigInt: bigint,
): TransactionVerificationStatus => {
    const parsed = parseUnsignedEvmTransaction(tx.unsignedTransaction);

    if (!parsed || !vaultAddress) return 'skipped';

    switch (tx.type) {
        case TransactionDtoType.APPROVAL:
            return verifyApproval(parsed.data, vaultAddress, amountBigInt);
        case TransactionDtoType.SUPPLY:
            return verifySupply(parsed.data, parsed.to, vaultAddress, address, amountBigInt);
        default:
            return 'skipped';
    }
};

export const verifyEnterTransactions = (
    response: EnterYieldResponseSuccess,
    { yieldId, address, amount, decimals }: VerifyEnterTransactionsParams,
): VerificationStatus => {
    const vaultAddress = EVM_VAULT_ADDRESSES[yieldId];
    const amountBigInt = BigInt(
        new BigNumber(amount).times(new BigNumber(10).pow(decimals)).toFixed(0),
    );

    const statuses = response.data.transactions.map(tx =>
        getTransactionStatus(tx, vaultAddress, asEvmAddress(address), amountBigInt),
    );

    return aggregateStatuses(statuses);
};
