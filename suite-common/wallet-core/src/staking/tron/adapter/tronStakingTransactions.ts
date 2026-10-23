import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import { isTronProductSuperRepresentative, listTronStakingProducts } from './tronStakingProducts';
import { type TronStakingOperation, type TronStakingTxClassification } from './types';

const getTronStakingOperation = (contractType: string | undefined): TronStakingOperation | null => {
    switch (contractType) {
        case 'FreezeBalanceContract':
        case 'FreezeBalanceV2Contract':
            return 'freeze';
        case 'UnfreezeBalanceContract':
        case 'UnfreezeBalanceV2Contract':
            return 'unfreeze';
        case 'VoteWitnessContract':
            return 'vote';
        case 'WithdrawExpireUnfreezeContract':
            return 'withdraw';
        case 'WithdrawBalanceContract':
            return 'claim';
        default:
            return null;
    }
};

export const classifyTronStakingTransaction = (
    tx: WalletAccountTransaction,
): TronStakingTxClassification | null => {
    const operation = getTronStakingOperation(tx.tronSpecific?.contractType);

    if (!operation) return null;

    const votedAddresses = (tx.tronSpecific?.votes ?? []).flatMap(vote =>
        vote.address ? [vote.address] : [],
    );

    const productIds = listTronStakingProducts(tx.symbol)
        .filter(product =>
            votedAddresses.some(address => isTronProductSuperRepresentative(product, address)),
        )
        .map(product => product.id);

    return { operation, productIds };
};
