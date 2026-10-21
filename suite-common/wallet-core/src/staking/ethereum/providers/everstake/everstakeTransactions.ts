import { type BaseStakeType, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { getSignatureByEthereumDataHex } from '@suite-common/wallet-utils';
import { type InternalTransfer } from '@trezor/blockchain-link-types';
import {
    type EverstakeOperation,
    getEverstakeOperationBySelector,
} from '@trezor/network-ethereum/staking';

import { type StakingTransferAccount, type StakingTxClassification } from '../types';
import { getUnstakeAmountWeiFromCalldata } from './everstakeCalldata';
import { STAKE_GAS_LIMIT_RESERVE } from './everstakeConstants';
import { getEverstakeContractsBySymbol } from './everstakeContracts';

const OPERATION_TO_STAKE_TYPE: Record<EverstakeOperation, BaseStakeType> = {
    stake: 'stake',
    unstake: 'unstake',
    claimWithdrawRequest: 'claim',
};

const classify = (selector: string | undefined, data?: string): StakingTxClassification | null => {
    const operation = getEverstakeOperationBySelector(selector);

    if (!operation) return null;

    const type = OPERATION_TO_STAKE_TYPE[operation];
    const amount = type === 'unstake' && data ? getUnstakeAmountWeiFromCalldata(data) : null;

    return {
        providerId: 'everstake',
        type,
        ...(amount ? { amount } : {}),
        gasReserve: STAKE_GAS_LIMIT_RESERVE,
    };
};

export const classifyEverstakeCalldata = (data: string | undefined) =>
    data ? classify(getSignatureByEthereumDataHex(data), data) : null;

// Blockbook parses the selector into parsedData; the raw data covers backends that do not.
export const classifyEverstakeTransaction = (tx: WalletAccountTransaction) => {
    const { ethereumSpecific } = tx;

    if (!ethereumSpecific) return null;

    const { parsedData, data } = ethereumSpecific;

    const selector =
        parsedData?.methodId ?? (data ? getSignatureByEthereumDataHex(data) : undefined);

    return classify(selector, data);
};

// Instant operations settle through internal transfers between the pool, the withdraw treasury
// and the account rather than through the account's own transaction.
export const classifyEverstakeInternalTransfer = (
    { from, to }: Pick<InternalTransfer, 'from' | 'to'>,
    { descriptor, symbol }: StakingTransferAccount,
): BaseStakeType | null => {
    const contracts = getEverstakeContractsBySymbol(symbol);

    if (!contracts) return null;

    const { pool, withdrawTreasury } = contracts;

    if (from === pool && to === withdrawTreasury) {
        return 'stake';
    }

    if (from === pool && to === descriptor) {
        return 'unstake';
    }

    if (from === withdrawTreasury && to === descriptor) {
        return 'claim';
    }

    return null;
};
