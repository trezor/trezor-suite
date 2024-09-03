import { Banner, Text } from '@trezor/components';
import { Translation } from 'src/components/suite';
import styled from 'styled-components';
import { spacings } from '@trezor/theme';
import { useSelector } from 'src/hooks/suite';
import { StakeType, WalletAccountTransaction } from '@suite-common/wallet-types';
import { InternalTransfer } from '@trezor/connect';
import { fromWei } from 'web3-utils';
import { getChangedInternalTx, getInstantStakeType } from 'src/utils/suite/stake';
import { useEffect, useRef, useState } from 'react';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

const TextWrapper = styled.div`
    flex: 1;
`;

const getTranslationId = (stakeType: StakeType) => {
    if (stakeType === 'stake') return 'TR_STAKING_INSTANTLY_STAKED';

    return 'TR_STAKING_INSTANTLY_UNSTAKED';
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
            variant="info"
            icon="lightning"
            margin={{ bottom: spacings.sm }}
            rightContent={
                <Banner.Button onClick={closeBanner}>
                    <Translation id="TR_GOT_IT" />
                </Banner.Button>
            }
        >
            <TextWrapper>
                <Text typographyStyle="body" color="inherit">
                    <Translation
                        id={getTranslationId(stakeType)}
                        values={{
                            amount,
                            symbol: symbol?.toUpperCase(),
                            days: remainingDays ?? 0,
                        }}
                    />
                </Text>
            </TextWrapper>
        </Banner>
    );
};
