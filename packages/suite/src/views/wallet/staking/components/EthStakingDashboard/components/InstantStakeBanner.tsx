import { useEffect, useRef, useState } from 'react';

import { fromWei } from 'web3-utils';

import { Banner, Column, H3, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { StakeType, WalletAccountTransaction } from '@suite-common/wallet-types';
import { InternalTransfer } from '@trezor/connect';

import { useSelector } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { getChangedInternalTx, getInstantStakeType } from 'src/utils/suite/stake';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

const getSubheadingTranslationId = (stakeType: StakeType) => {
    if (stakeType === 'stake') return 'TR_STAKING_INSTANTLY_STAKED';

    return 'TR_STAKE_INSTANTLY_UNSTAKED_WITH_DAYS';
};

const getHeadingTranslationId = (stakeType: StakeType) => {
    if (stakeType === 'stake') return 'TR_STAKING_AMOUNT_STAKED_INSTANTLY';

    return 'TR_STAKING_AMOUNT_UNSTAKED_INSTANTLY';
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

    const remainingDays = stakeType === 'stake' ? daysToAddToPool : daysToUnstake;

    return (
        <Banner
            icon="lightning"
            variant="tertiary"
            rightContent={
                <Banner.Button onClick={closeBanner} variant="primary">
                    <Translation id="TR_GOT_IT" />
                </Banner.Button>
            }
        >
            <Column gap={spacings.xxs} alignItems="flex-start">
                <H3 typographyStyle="highlight">
                    <Translation
                        id={getHeadingTranslationId(stakeType)}
                        values={{
                            amount,
                            symbol: symbol?.toUpperCase(),
                        }}
                    />
                </H3>
                <Paragraph>
                    <Translation
                        id={getSubheadingTranslationId(stakeType)}
                        values={{
                            amount,
                            symbol: symbol?.toUpperCase(),
                            days: remainingDays ?? 0,
                        }}
                    />
                </Paragraph>
            </Column>
        </Banner>
    );
};
