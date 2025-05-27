import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { MAX_DEACTIVATE_ACCOUNTS_WITH_SPLIT, claim, unstake } from '@suite-common/staking-solana';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { WALLET_SDK_SOURCE } from '@suite-common/wallet-constants';
import { selectBlockchainState } from '@suite-common/wallet-core';
import { Account, PrecomposedLevels } from '@suite-common/wallet-types';
import {
    formatNetworkAmount,
    getOutputTxAmount,
    getSolanaStakingAccountsByStatus,
} from '@suite-common/wallet-utils';
import { StakeState } from '@trezor/blockchain-link-types/src/solana';
import { Banner } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { Translation } from 'src/components/suite';

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
        if (account.networkType !== 'solana') return;

        const outputTxAmount = getOutputTxAmount(composedLevels);
        if (!outputTxAmount || !selectedBlockchain?.url) return;

        const estimateTx = async () => {
            if (type === 'unstake') {
                const { unstakeAmount } = await unstake({
                    network: account.symbol,
                    sender: account.descriptor,
                    lamports: BigInt(outputTxAmount),
                    source: WALLET_SDK_SOURCE,
                    url: selectedBlockchain.url,
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
                    network: account.symbol,
                    sender: account.descriptor,
                    url: selectedBlockchain.url,
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
        <Banner variant="info">
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
        </Banner>
    );
};
