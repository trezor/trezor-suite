import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { selectBlockchainState } from '@suite-common/wallet-core';
import { type Account, type PrecomposedLevels } from '@suite-common/wallet-types';
import {
    type SolanaStakingLimit,
    estimateSolanaStakingLimit,
    formatNetworkAmount,
    getOutputTxAmount,
    getSolanaDeactivatedRentReserves,
} from '@suite-common/wallet-utils';
import { Banner } from '@trezor/components';
import { getSuiteVersion } from '@trezor/env-utils';
import { MAX_DEACTIVATE_ACCOUNTS_WITH_SPLIT } from '@trezor/network-solana/constants';

interface SolanaStakingLimitBannerProps {
    account: Account;
    composedLevels?: PrecomposedLevels;
    type: 'claim' | 'unstake';
}

const NO_LIMIT: SolanaStakingLimit = { isLimitExceeded: false, estimatedAmount: '0' };

export const SolanaStakingLimitBanner = ({
    account,
    composedLevels,
    type,
}: SolanaStakingLimitBannerProps) => {
    const blockchain = useSelector(selectBlockchainState);

    const [limit, setLimit] = useState<SolanaStakingLimit>(NO_LIMIT);

    const selectedBlockchain = blockchain[account.symbol];

    useEffect(() => {
        if (account.networkType !== 'solana') {
            return;
        }

        const outputTxAmount = getOutputTxAmount(composedLevels);
        if (!outputTxAmount || !selectedBlockchain?.url) return;

        let isActive = true;

        estimateSolanaStakingLimit({
            descriptor: account.descriptor,
            deactivatedRentReserves: getSolanaDeactivatedRentReserves(account),
            blockchainUrl: selectedBlockchain.url,
            userAgent: `Trezor Suite ${getSuiteVersion()}`,
            type,
            outputAmount: outputTxAmount.toString(),
        })
            .then(resolved => {
                if (isActive) {
                    setLimit(resolved);
                }
            })
            .catch(() => {
                if (isActive) {
                    setLimit(NO_LIMIT);
                }
            });

        return () => {
            isActive = false;
        };
    }, [account, composedLevels, selectedBlockchain?.url, type]);

    if (!limit.isLimitExceeded) return null;

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
                        amount: formatNetworkAmount(limit.estimatedAmount, account.symbol),
                        symbol: getDisplaySymbol(account.symbol),
                    }}
                />
            }
        />
    );
};
