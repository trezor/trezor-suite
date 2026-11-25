import {
    type GetPositionParams,
    type StakingAccount,
    type StakingAmount,
    type StakingOperation,
    type StakingPosition,
    type StakingPositionPendingTransaction,
    type StakingProductId,
    type StakingTransaction,
    isPendingStakingTransaction,
} from '@suite-common/earn-staking-common';
import { type LidoDeployment } from '@trezor/network-ethereum-suite-common';
import { BigNumber } from '@trezor/utils';

import { ETHEREUM_LIDO_OPERATIONS_BY_METHOD_ID } from './constants';
import { lidoProvider } from '../../../providers/lido';
import { getStakingPositionStatus } from '../../../utils/getStakingPositionStatus';
import {
    ZERO_STAKING_AMOUNT,
    isPositiveStakingAmount,
    toStakingAmount,
} from '../../../utils/stakingAmounts';

const WSTETH_DECIMALS = 18;

// The app account carries a token balance in whole tokens, not in the token's smallest unit.
const getWstETHBalance = (account: StakingAccount, deployment: LidoDeployment): StakingAmount => {
    const token = account.tokens?.find(
        ({ contract }) => contract.toLowerCase() === deployment.wstETH,
    );

    if (token?.balance === undefined) {
        return ZERO_STAKING_AMOUNT;
    }

    return toStakingAmount(new BigNumber(token.balance).shiftedBy(token.decimals));
};

const getLidoPendingTransactions = (
    transactions: readonly StakingTransaction[],
): StakingPositionPendingTransaction[] =>
    transactions.filter(isPendingStakingTransaction).flatMap(transaction => {
        const methodId = transaction.ethereumSpecific?.parsedData?.methodId?.toLowerCase() ?? '';
        const operation = ETHEREUM_LIDO_OPERATIONS_BY_METHOD_ID[methodId];

        if (operation === undefined) return [];

        return [{ txid: transaction.txid, operation }];
    });

export type GetEthereumLidoLiquidProductPositionParams = GetPositionParams & {
    productId: StakingProductId;
    deployment: LidoDeployment;
};

export const getEthereumLidoLiquidProductPosition = ({
    productId,
    deployment,
    account,
    productInfo,
    transactions,
}: GetEthereumLidoLiquidProductPositionParams): StakingPosition | null => {
    const tokenBalance = getWstETHBalance(account, deployment);
    const pendingTransactions = getLidoPendingTransactions(transactions);
    const hasPendingOperation = (operation: StakingOperation) =>
        pendingTransactions.some(transaction => transaction.operation === operation);

    const hasTokens = isPositiveStakingAmount(tokenBalance);

    if (!hasTokens && !hasPendingOperation('stake')) {
        return null;
    }

    // The stake is the worth of the tokens in ETH, which only the product info knows.
    const liquidTokenValue = productInfo?.liquidTokenValue ?? null;

    if (hasTokens && liquidTokenValue === null) {
        return null;
    }

    const staked = toStakingAmount(
        new BigNumber(tokenBalance)
            .times(liquidTokenValue ?? 0)
            .shiftedBy(-WSTETH_DECIMALS)
            .integerValue(BigNumber.ROUND_DOWN),
    );

    // The withdrawal requests live in the queue contract, which the account data does not carry,
    // so the flows read them from the chain.
    const balances = {
        staked,
        pending: ZERO_STAKING_AMOUNT,
        unstaking: ZERO_STAKING_AMOUNT,
        withdrawable: ZERO_STAKING_AMOUNT,
        rewards: ZERO_STAKING_AMOUNT,
    };

    const positionStatus = getStakingPositionStatus({ balances });
    const operations: StakingOperation[] = ['stake'];

    if (hasTokens && pendingTransactions.length === 0) {
        operations.push('unstake');
    }

    return {
        productId,
        status: positionStatus === 'inactive' ? 'activating' : positionStatus,
        lockup: 'liquid',
        balances,
        activations: [],
        unlocks: [],
        targets: hasTokens
            ? [
                  {
                      address: deployment.wstETH,
                      providerId: lidoProvider.id,
                      name: lidoProvider.name,
                      amount: staked,
                  },
              ]
            : [],
        operations,
        pendingTransactions,
        warnings: [],
        details: { kind: 'liquid-token', contract: deployment.wstETH, balance: tokenBalance },
        revalidateAt: null,
    };
};
