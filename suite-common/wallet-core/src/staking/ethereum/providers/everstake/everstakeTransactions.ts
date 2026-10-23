import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type BaseStakeType, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { getSignatureByEthereumDataHex } from '@suite-common/wallet-utils';
import { type InternalTransfer } from '@trezor/blockchain-link-types';
import {
    type EverstakeOperation,
    getEverstakeOperationBySelector,
} from '@trezor/network-ethereum/staking';

import {
    type StakingTransferAccount,
    type StakingTransferClassification,
    type StakingTxClassification,
} from '../types';
import { getUnstakeAmountWeiFromCalldata } from './everstakeCalldata';
import { STAKE_GAS_LIMIT_RESERVE } from './everstakeConstants';
import { findEverstakeProduct } from './everstakeContracts';

const OPERATION_TO_STAKE_TYPE: Record<EverstakeOperation, BaseStakeType> = {
    stake: 'stake',
    unstake: 'unstake',
    claimWithdrawRequest: 'claim',
};

type ClassifyParams = {
    symbol: NetworkSymbol;
    selector: string | undefined;
    data?: string;
};

const classify = ({ symbol, selector, data }: ClassifyParams): StakingTxClassification | null => {
    const product = findEverstakeProduct(symbol);
    const operation = getEverstakeOperationBySelector(selector);

    if (!product || !operation) return null;

    const type = OPERATION_TO_STAKE_TYPE[operation];
    const amount = type === 'unstake' && data ? getUnstakeAmountWeiFromCalldata(data) : null;

    return {
        productId: product.id,
        type,
        ...(amount ? { amount } : {}),
        gasReserve: STAKE_GAS_LIMIT_RESERVE,
    };
};

export const classifyEverstakeCalldata = (data: string | undefined, symbol: NetworkSymbol) =>
    data ? classify({ symbol, selector: getSignatureByEthereumDataHex(data), data }) : null;

// Blockbook parses the selector into parsedData; the raw data covers backends that do not.
export const classifyEverstakeTransaction = (tx: WalletAccountTransaction) => {
    const { ethereumSpecific } = tx;

    if (!ethereumSpecific) return null;

    const { parsedData, data } = ethereumSpecific;

    const selector =
        parsedData?.methodId ?? (data ? getSignatureByEthereumDataHex(data) : undefined);

    return classify({ symbol: tx.symbol, selector, data });
};

// Instant operations settle through internal transfers between the pool, the withdraw treasury
// and the account rather than through the account's own transaction.
export const classifyEverstakeInternalTransfer = (
    { from, to }: Pick<InternalTransfer, 'from' | 'to'>,
    { descriptor, symbol }: StakingTransferAccount,
): StakingTransferClassification | null => {
    const product = findEverstakeProduct(symbol);

    if (!product) return null;

    const { pool, withdrawTreasury } = product.identity.contracts;
    const classified = (type: BaseStakeType) => ({ productId: product.id, type });

    if (from === pool && to === withdrawTreasury) {
        return classified('stake');
    }

    if (from === pool && to === descriptor) {
        return classified('unstake');
    }

    if (from === withdrawTreasury && to === descriptor) {
        return classified('claim');
    }

    return null;
};
