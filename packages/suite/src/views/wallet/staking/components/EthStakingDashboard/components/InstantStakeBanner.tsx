import { Banner, Column, H3, Icon, Paragraph, Row } from '@trezor/components';
import { Translation } from 'src/components/suite';
import styled, { useTheme } from 'styled-components';
import { spacings, spacingsPx } from '@trezor/theme';
import { useSelector } from 'src/hooks/suite';
import { StakeType, WalletAccountTransaction } from '@suite-common/wallet-types';
import { InternalTransfer } from '@trezor/connect';
import { fromWei } from 'web3-utils';
import { getChangedInternalTx, getInstantStakeType } from 'src/utils/suite/stake';
import { useEffect, useRef, useState } from 'react';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

const IconWrapper = styled.div`
    background: ${({ theme }) => theme.backgroundAlertYellowBold};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: ${spacingsPx.xxxxl};
    min-height: ${spacingsPx.xxxxl};
`;

const getSubheadingTranslationId = (stakeType: StakeType) => {
    if (stakeType === 'stake') return 'TR_STAKING_INSTANTLY_STAKED';

    return 'TR_STAKING_INSTANTLY_UNSTAKED';
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

    const theme = useTheme();
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
            variant="tertiary"
            margin={{ bottom: spacings.sm }}
            rightContent={
                <Banner.Button onClick={closeBanner} variant="primary">
                    <Translation id="TR_GOT_IT" />
                </Banner.Button>
            }
        >
            <Row gap={spacings.md}>
                <IconWrapper>
                    <Icon color={theme.iconDefaultInverted} name="lightningFilled" />
                </IconWrapper>
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
            </Row>
        </Banner>
    );
};
