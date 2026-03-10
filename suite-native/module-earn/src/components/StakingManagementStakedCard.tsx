import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectPoolStatsNextRewardPayout } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { Button, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import {
    selectAPYByAccountKey,
    selectRewardsBalanceByAccountKey,
    selectStakedBalanceByAccountKey,
    useSelector,
} from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { CRYPTO_BALANCE_DECIMALS } from '../constants';

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

export const StakingManagementStakedCard = ({
    accountKey,
    networkSymbol,
}: StakingManagementStakedCardProps) => {
    const { applyStyle } = useNativeStyles();

    const stakedBalance = useSelector(state => selectStakedBalanceByAccountKey(state, accountKey));
    const rewardsBalance = useSelector(state =>
        selectRewardsBalanceByAccountKey(state, accountKey),
    );
    const apy = useSelector(state => selectAPYByAccountKey(state, accountKey));
    const nextRewardPayout = useSelector(state =>
        selectPoolStatsNextRewardPayout(state, networkSymbol),
    );

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
                    <Translation
                        id="earn.stakingManagementScreen.apyLabel"
                        values={{ value: apy ?? 0 }}
                    />
                </Text>
                <Text variant="body-sm">
                    <Translation
                        id="earn.stakingManagementScreen.nextRewardLabel"
                        values={{ value: nextRewardPayout ?? 0 }}
                    />
                </Text>
            </HStack>
            <HStack style={applyStyle(buttonsRowStyle)}>
                <Button flex={1} colorScheme="primaryElevation0">
                    <Translation id="earn.stakingManagementScreen.unstakeButton" />
                </Button>
                <Button flex={1} colorScheme="primaryElevation0">
                    <Translation id="earn.stakingManagementScreen.stakeMoreButton" />
                </Button>
            </HStack>
        </Card>
    );
};
