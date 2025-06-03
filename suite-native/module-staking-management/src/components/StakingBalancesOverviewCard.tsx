import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { Box, Card, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    NativeStakingRootState,
    selectAPYByAccountKey,
    selectRewardsBalanceByAccountKey,
    selectStakedBalanceByAccountKey,
} from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const stakingItemStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: utils.spacings.sp4,
    paddingBottom: utils.spacings.sp8,
}));

const stakingWrapperStyle = prepareNativeStyle(utils => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingBottom: utils.spacings.sp16,
}));

const separatorStyle = prepareNativeStyle(utils => ({
    borderBottomWidth: utils.borders.widths.small,
    borderBottomColor: utils.colors.borderElevation1,
}));

type StakingBalancesCardProps = {
    accountKey: string;
    handleToggleBottomSheet: (value: boolean) => void;
};

const CRYPTO_BALANCE_DECIMALS = 5;

export const StakingBalancesOverviewCard = ({
    accountKey,
    handleToggleBottomSheet,
}: StakingBalancesCardProps) => {
    const { applyStyle } = useNativeStyles();

    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const apy = useSelector((state: NativeStakingRootState) =>
        selectAPYByAccountKey(state, accountKey),
    );

    const stakedBalance = useSelector((state: NativeStakingRootState) =>
        selectStakedBalanceByAccountKey(state, accountKey),
    );
    const rewardsBalance = useSelector((state: NativeStakingRootState) =>
        selectRewardsBalanceByAccountKey(state, accountKey),
    );

    if (!symbol) return null;

    const rewardsTitle = ['sol', 'dsol'].includes(symbol) ? (
        <Translation id="staking.rewardsPerEpoch" />
    ) : (
        <Translation id="staking.rewards" />
    );

    return (
        <TouchableOpacity onPress={() => handleToggleBottomSheet(true)}>
            <Card>
                <Box style={applyStyle(stakingWrapperStyle)}>
                    <Box flex={1}>
                        <Box style={applyStyle(stakingItemStyle)}>
                            <Icon name="lock" color="textSubdued" size="medium" />
                            <Text color="textSubdued" variant="label">
                                <Translation id="staking.staked" />
                            </Text>
                        </Box>
                        <CryptoAmountFormatter
                            value={stakedBalance}
                            symbol={symbol}
                            decimals={CRYPTO_BALANCE_DECIMALS}
                            color="textDefault"
                            variant="titleSmall"
                        />
                        <Box flexDirection="row">
                            <Text color="textSubdued">≈</Text>
                            <CryptoToFiatAmountFormatter
                                value={stakedBalance}
                                symbol={symbol}
                                color="textSubdued"
                                isBalance
                            />
                        </Box>
                    </Box>
                    <Box flex={1}>
                        <Box style={applyStyle(stakingItemStyle)}>
                            <Icon name="plusCircle" color="textSubdued" size="medium" />
                            <Text color="textSubdued" variant="label">
                                {rewardsTitle}
                            </Text>
                        </Box>
                        <CryptoAmountFormatter
                            value={rewardsBalance}
                            symbol={symbol}
                            decimals={CRYPTO_BALANCE_DECIMALS}
                            color="textSecondaryHighlight"
                            variant="titleSmall"
                        />
                        <Box flexDirection="row">
                            <Text color="textSubdued">≈</Text>
                            <CryptoToFiatAmountFormatter
                                value={rewardsBalance}
                                symbol={symbol}
                                color="textSubdued"
                                isBalance
                            />
                        </Box>
                    </Box>
                </Box>
                <Box style={applyStyle(separatorStyle)} />

                <Box
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between"
                    paddingTop="sp16"
                >
                    <Text color="textSubdued">
                        <Translation id="staking.apy" />
                    </Text>
                    <Text>{apy}%</Text>
                </Box>
            </Card>
        </TouchableOpacity>
    );
};
