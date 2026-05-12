import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { WALLET_SDK_SOURCE } from '@suite-common/wallet-constants';
import { selectBlockchainState } from '@suite-common/wallet-core';
import { type Account, type PrecomposedLevels } from '@suite-common/wallet-types';
import {
    formatNetworkAmount,
    getOutputTxAmount,
    getSolanaStakingAccountsByStatus,
} from '@suite-common/wallet-utils';
import { MAX_DEACTIVATE_ACCOUNTS_WITH_SPLIT, StakeState } from '@trezor/coins-solana/constants';
import solana from '@trezor/coins-solana/runtime';
import { Banner } from '@trezor/components';
import { getSuiteVersion } from '@trezor/env-utils';
import { BigNumber } from '@trezor/utils';

interface SolanaStakingLimitBannerProps {
    account: Account;
    composedLevels?: PrecomposedLevels;
    type: 'claim' | 'unstake';
}

export const SolanaStakingLimitBanner = ({
    account,
    composedLevels,
    type,
}: SolanaStakingLimitBannerProps) => {
    const blockchain = useSelector(selectBlockchainState);

    const [estimatedAmount, setEstimatedAmount] = useState<string>('0');
    const [isAccountLimitExeeded, setIsAccountLimitExeeded] = useState<boolean>(false);

    const selectedBlockchain = blockchain[account.symbol];

    useEffect(() => {
        if (account.networkType !== 'solana') {
            return;
        }

        const outputTxAmount = getOutputTxAmount(composedLevels);
        if (!outputTxAmount || !selectedBlockchain?.url) return;

        const estimateTx = async () => {
            const { selectSolanaConnection, unstake, claim } = await solana();
            const connection = selectSolanaConnection(
                selectedBlockchain.url,
                `Trezor Suite ${getSuiteVersion()}`,
            );

            if (type === 'unstake') {
                const { unstakeAmount } = await unstake({
                    connection,
                    sender: account.descriptor,
                    lamports: BigInt(outputTxAmount),
                    source: WALLET_SDK_SOURCE,
                });
                const estimatedAmount = unstakeAmount.toString();
                setEstimatedAmount(estimatedAmount);

                // If the estimated transaction amount is less than the output,
                // we assume the account limit has been exceeded
                const isLimitExeeded = new BigNumber(estimatedAmount).lt(outputTxAmount);
                setIsAccountLimitExeeded(isLimitExeeded);
            }

            if (type === 'claim') {
                const { totalClaimAmount } = await claim({
                    connection,
                    sender: account.descriptor,
                });

                const estimatedAmount = totalClaimAmount.toString();
                setEstimatedAmount(estimatedAmount);

                const stakingAccounts = getSolanaStakingAccountsByStatus(
                    account,
                    StakeState.Deactivated,
                );
                // estimatedAmount for claims includes rent-exempt reserves.
                // We subtract rent from each account to get the real claimable amount.
                const claimableAmount = stakingAccounts.reduce(
                    (acc, { rentExemptReserve }) => acc.minus(rentExemptReserve),
                    new BigNumber(estimatedAmount),
                );

                const isLimitExeeded = claimableAmount.lt(outputTxAmount);
                setIsAccountLimitExeeded(isLimitExeeded);
            }
        };

        estimateTx();
    }, [account, composedLevels, selectedBlockchain?.url, type]);

    if (!isAccountLimitExeeded) return null;

    return (
        <Banner
            intent="info"
            description={
                <Translation
                    id={
                        type === 'claim'
                            ? 'TR_STAKE_CAN_CLAIM_FROM_ACCOUNTS'
                            : 'TR_STAKE_CAN_UNSTAKE_FROM_ACCOUNTS'
                    }
                    values={{
                        limit: MAX_DEACTIVATE_ACCOUNTS_WITH_SPLIT,
                        amount: formatNetworkAmount(estimatedAmount, account.symbol),
                        symbol: getDisplaySymbol(account.symbol),
                    }}
                />
            }
        />
    );
};
