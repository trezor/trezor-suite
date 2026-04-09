import { useNavigation } from '@react-navigation/native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectEthNextRewardPayout } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Button, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import {
    selectApy,
    selectRewardsBalanceByAccountKey,
    selectStakedBalanceByAccountKey,
    useSelector,
} from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { BigNumber } from '@trezor/utils';

import { CRYPTO_BALANCE_DECIMALS } from '../constants';
import { ApyValue } from './ApyValue';

type StakingManagementStakedCardProps = {
    accountKey: AccountKey;
    networkSymbol: NetworkSymbol;
};

const stakedSectionStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp16,
    borderBottomWidth: utils.borders.widths.small,
    borderBottomColor: utils.colors.borderElevation1,
}));

const buttonsRowStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp16,
    gap: utils.spacings.sp12,
}));

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.StakingManagement>;

export const StakingManagementStakedCard = ({
    accountKey,
    networkSymbol,
}: StakingManagementStakedCardProps) => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProp>();

    const handleStake = () => {
        navigation.navigate(RootStackRoutes.HowStakeWorksScreen, {
            accountKey,
            symbol: networkSymbol,
        });
    };

    const handleUnstake = () => {
        navigation.navigate(RootStackRoutes.UnstakeFlow, { accountKey });
    };

    const stakedBalance = useSelector(state => selectStakedBalanceByAccountKey(state, accountKey));
    const hasStakedBalance = new BigNumber(stakedBalance ?? '0').gt(0);
    const rewardsBalance = useSelector(state =>
        selectRewardsBalanceByAccountKey(state, accountKey),
    );
    const apy = useSelector(state => selectApy(state, { accountKey, networkSymbol }));
    const nextRewardPayout = useSelector(state => selectEthNextRewardPayout(state));

    return (
        <Card noPadding>
            <VStack spacing="sp4" style={applyStyle(stakedSectionStyle)}>
                <Text variant="body-md" color="textSubdued">
                    <Translation id="earn.stakingManagementScreen.stakedLabel" />
                </Text>
                <CryptoAmountFormatter
                    value={stakedBalance}
                    symbol={networkSymbol}
                    decimals={CRYPTO_BALANCE_DECIMALS}
                    variant="headline-sm"
                    color="textDefault"
                />
                <CryptoToFiatAmountFormatter
                    value={stakedBalance}
                    symbol={networkSymbol}
                    color="textSubdued"
                    isBalance
                />
            </VStack>
            <VStack spacing="sp4" style={applyStyle(stakedSectionStyle)}>
                <Text variant="body-md" color="textSubdued">
                    <Translation id="earn.stakingManagementScreen.totalRewardsLabel" />
                </Text>
                <CryptoAmountFormatter
                    value={rewardsBalance}
                    symbol={networkSymbol}
                    decimals={CRYPTO_BALANCE_DECIMALS}
                    variant="headline-sm"
                    color="textDefault"
                />
                <CryptoToFiatAmountFormatter
                    value={rewardsBalance}
                    symbol={networkSymbol}
                    color="textSubdued"
                    isBalance
                />
            </VStack>
            <HStack justifyContent="space-between" style={applyStyle(stakedSectionStyle)}>
                <Text variant="body-sm">
                    {apy != null && 'APY '}
                    <ApyValue apy={apy} />
                </Text>
                {nextRewardPayout != null && (
                    <Text variant="body-sm">
                        <Translation
                            id="earn.stakingManagementScreen.nextRewardLabel"
                            values={{ value: nextRewardPayout }}
                        />
                    </Text>
                )}
            </HStack>
            <HStack style={applyStyle(buttonsRowStyle)}>
                {hasStakedBalance && (
                    <Button flex={1} colorScheme="primaryElevation0" onPress={handleUnstake}>
                        <Translation id="earn.stakingManagementScreen.unstakeButton" />
                    </Button>
                )}
                <Button flex={1} colorScheme="primaryElevation0" onPress={handleStake}>
                    <Translation
                        id={
                            hasStakedBalance
                                ? 'earn.stakingManagementScreen.stakeMoreButton'
                                : 'earn.stakingManagementScreen.stakeButton'
                        }
                    />
                </Button>
            </HStack>
        </Card>
    );
};
