import { useTheme } from 'styled-components';

import { NetworkType, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    MIN_ETH_AMOUNT_FOR_STAKING,
    MIN_SOL_AMOUNT_FOR_STAKING,
} from '@suite-common/wallet-constants';
import { selectPoolStatsApyData } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import {
    isSupportedEthStakingNetworkSymbol,
    isSupportedSolStakingNetworkSymbol,
} from '@suite-common/wallet-utils';
import { Banner, Button, Column, IconButton, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { setFlag } from 'src/actions/suite/suiteActions';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSuiteFlags } from 'src/reducers/suite/suiteReducer';

interface StakingBannerProps {
    account: Account;
}

export const StakingBanner = ({ account }: StakingBannerProps) => {
    const dispatch = useDispatch();
    const { stakeEthBannerClosed, stakeSolBannerClosed } = useSelector(selectSuiteFlags);
    const { route } = useSelector(state => state.router);
    const apy = useSelector(state => selectPoolStatsApyData(state, account.symbol));
    const theme = useTheme();

    const closeBanner = () => {
        switch (account.networkType) {
            case 'ethereum':
                dispatch(setFlag('stakeEthBannerClosed', true));
                break;
            case 'solana':
                dispatch(setFlag('stakeSolBannerClosed', true));
                break;
        }
    };

    const goToStakingTab = () => {
        dispatch(goto('wallet-staking', { preserveParams: true }));
    };

    const getNetworkDetails = (networkType: NetworkType) => {
        switch (networkType) {
            case 'ethereum':
                return {
                    isStakingBannerClosed: stakeEthBannerClosed,
                    minStakingAmount: MIN_ETH_AMOUNT_FOR_STAKING,
                    isSupportedStakingNetworkSymbol: isSupportedEthStakingNetworkSymbol(
                        account.symbol,
                    ),
                };
            case 'solana':
                return {
                    isStakingBannerClosed: stakeSolBannerClosed,
                    minStakingAmount: MIN_SOL_AMOUNT_FOR_STAKING,
                    isSupportedStakingNetworkSymbol: isSupportedSolStakingNetworkSymbol(
                        account.symbol,
                    ),
                };
            default:
                return {
                    isStakingBannerClosed: true,
                    minStakingAmount: undefined,
                    isSupportedStakingNetworkSymbol: false,
                };
        }
    };

    const { isStakingBannerClosed, minStakingAmount, isSupportedStakingNetworkSymbol } =
        getNetworkDetails(account.networkType) ?? {};

    if (
        route?.name !== 'wallet-index' ||
        isStakingBannerClosed ||
        !account ||
        !isSupportedStakingNetworkSymbol
    ) {
        return null;
    }

    return (
        <Banner
            variant="tertiary"
            icon="piggyBankFilled"
            rightContent={
                <Row gap={8}>
                    <Button size="small" onClick={goToStakingTab} textWrap={false}>
                        <Translation id="TR_STAKE_LEARN_MORE" />
                    </Button>
                    <IconButton size="small" variant="tertiary" icon="x" onClick={closeBanner} />
                </Row>
            }
        >
            <Column gap={4} alignItems="flex-start" flex="1" margin={{ left: spacings.xs }}>
                <Text color={theme.textSubdued} typographyStyle="callout">
                    <Translation id="TR_STAKE_ETH_EARN_REPEAT" />
                </Text>

                <Text typographyStyle="body" textWrap="balance">
                    <Translation
                        id="TR_STAKE_ANY_AMOUNT_ETH"
                        values={{
                            apyPercent: apy,
                            networkDisplaySymbol: getNetworkDisplaySymbol(account.symbol),
                            amount: minStakingAmount?.toString(),
                        }}
                    />
                </Text>
            </Column>
        </Banner>
    );
};
