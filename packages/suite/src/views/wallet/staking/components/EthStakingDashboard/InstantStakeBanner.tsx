import { useEffect, useRef, useState } from 'react';

import { Translation } from '@suite/intl';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { getChangedInternalTx, getInstantStakeType } from '@suite-common/wallet-core';
import {
    type Account,
    type StakeType,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { fromWei } from '@suite-common/wallet-utils';
import { Banner } from '@trezor/components';
import { type InternalTransfer } from '@trezor/connect';
import { LightningIcon } from '@trezor/icons';

const getSubheadingTranslationId = (stakeType: StakeType) => {
    if (stakeType === 'stake') return 'TR_EARN_INSTANTLY_STAKED';

    return 'TR_EARN_INSTANTLY_UNSTAKED_WITH_DAYS';
};

const getHeadingTranslationId = (stakeType: StakeType) => {
    if (stakeType === 'stake') return 'TR_EARN_AMOUNT_STAKED_INSTANTLY';

    return 'TR_EARN_AMOUNT_UNSTAKED_INSTANTLY';
};

interface InstantStakeBannerProps {
    account: Account;
    txs: WalletAccountTransaction[];
    daysToAddToPool?: number;
    daysToUnstake?: number;
}

export const InstantStakeBanner = ({
    account,
    txs,
    daysToAddToPool,
    daysToUnstake,
}: InstantStakeBannerProps) => {
    const { descriptor: address, symbol } = account;

    const [instantStakeTransfer, setInstantStakeTransfer] = useState<InternalTransfer | null>(null);
    const [isBannerShown, setIsBannerShown] = useState<boolean>(false);

    const prevTxs = useRef(txs);

    useEffect(() => {
        const changedInternalTx = getChangedInternalTx(prevTxs.current, txs, address, symbol);

        if (changedInternalTx) {
            setInstantStakeTransfer(changedInternalTx);
            setIsBannerShown(true);
        }

        prevTxs.current = txs;
    }, [txs, address, symbol]);

    if (!isBannerShown || !instantStakeTransfer) return null;

    const closeBanner = () => {
        setIsBannerShown(false);
    };

    const amount = fromWei(instantStakeTransfer?.amount ?? '0').toEther();
    const stakeType = getInstantStakeType(instantStakeTransfer, address, symbol);

    if (!stakeType || stakeType === 'claim') return null; // claim is not supported

    const displaySymbol = getNetworkDisplaySymbol(symbol);
    const remainingDays = stakeType === 'stake' ? daysToAddToPool : daysToUnstake;

    return (
        <Banner
            data-testid="@staking/instant-stake-banner"
            icon={LightningIcon}
            intent="neutral"
            rightContent={
                <Banner.Button
                    data-testid="@staking/instant-stake-banner/got-it-button"
                    onClick={closeBanner}
                    intent="brand"
                >
                    <Translation id="TR_GOT_IT" />
                </Banner.Button>
            }
            title={
                <span data-testid="@staking/instant-stake-banner/header">
                    <Translation
                        id={getHeadingTranslationId(stakeType)}
                        values={{
                            amount,
                            symbol: displaySymbol,
                        }}
                    />
                </span>
            }
            description={
                <span data-testid="@staking/instant-stake-banner/paragraph">
                    <Translation
                        id={getSubheadingTranslationId(stakeType)}
                        values={{
                            amount,
                            symbol: displaySymbol,
                            days: remainingDays ?? 0,
                        }}
                    />
                </span>
            }
        />
    );
};
