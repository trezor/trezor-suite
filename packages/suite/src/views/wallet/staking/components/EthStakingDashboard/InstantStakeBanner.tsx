import { useEffect, useRef, useState } from 'react';

import { fromWei } from 'web3-utils';

import { Translation } from '@suite/intl';
import { getChangedInternalTx, getInstantStakeType } from '@suite-common/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type StakeType, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { Banner } from '@trezor/components';
import { type InternalTransfer } from '@trezor/connect';

import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

const getSubheadingTranslationId = (stakeType: StakeType) => {
    if (stakeType === 'stake') return 'TR_EARN_INSTANTLY_STAKED';

    return 'TR_EARN_INSTANTLY_UNSTAKED_WITH_DAYS';
};

const getHeadingTranslationId = (stakeType: StakeType) => {
    if (stakeType === 'stake') return 'TR_EARN_AMOUNT_STAKED_INSTANTLY';

    return 'TR_EARN_AMOUNT_UNSTAKED_INSTANTLY';
};

interface InstantStakeBannerProps {
    txs: WalletAccountTransaction[];
    daysToAddToPool?: number;
    daysToUnstake?: number;
}

export const InstantStakeBanner = ({
    txs,
    daysToAddToPool,
    daysToUnstake,
}: InstantStakeBannerProps) => {
    const { descriptor: address, symbol } = useSelector(selectSelectedAccount) || {};

    const [instantStakeTransfer, setInstantStakeTransfer] = useState<InternalTransfer | null>(null);
    const [isBannerShown, setIsBannerShown] = useState<boolean>(false);

    const prevTxs = useRef(txs);

    useEffect(() => {
        if (!address || !symbol) return;
        const changedInternalTx = getChangedInternalTx(prevTxs.current, txs, address, symbol);

        if (changedInternalTx) {
            setInstantStakeTransfer(changedInternalTx);
            setIsBannerShown(true);
        }

        prevTxs.current = txs;
    }, [txs, address, symbol]);

    if (!isBannerShown || !instantStakeTransfer || !symbol || !address) return null;

    const closeBanner = () => {
        setIsBannerShown(false);
    };

    const amount = fromWei(instantStakeTransfer?.amount ?? '0', 'ether');
    const stakeType = getInstantStakeType(instantStakeTransfer, address, symbol);

    if (!stakeType || stakeType === 'claim') return null; // claim is not supported

    const displaySymbol = getNetworkDisplaySymbol(symbol);
    const remainingDays = stakeType === 'stake' ? daysToAddToPool : daysToUnstake;

    return (
        <Banner
            data-testid="@staking/instant-stake-banner"
            icon="lightning"
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
