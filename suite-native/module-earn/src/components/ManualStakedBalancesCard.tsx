import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box, Card, PressableOpacity, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { selectStakedBalanceByAccountKey, useSelector } from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ApyValue } from './ApyValue';

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
    borderBottomColor: utils.colors.borderNeutral,
}));

type ManualStakedBalancesCardProps = {
    accountKey: AccountKey;
    symbol: NetworkSymbol | null;
    rewardsBalance: string | null;
    apy: number | null;
    handleToggleBottomSheet: (value: boolean) => void;
};

const CRYPTO_BALANCE_DECIMALS = 5;

export const ManualStakedBalancesCard = ({
    accountKey,
    symbol,
    rewardsBalance,
    apy,
    handleToggleBottomSheet,
}: ManualStakedBalancesCardProps) => {
    const { applyStyle } = useNativeStyles();

    const stakedBalance = useSelector(state => selectStakedBalanceByAccountKey(state, accountKey));

    if (!symbol) return null;

    const rewardsTitle = ['sol', 'dsol'].includes(symbol) ? (
        <Translation id="earn.rewardsPerEpoch" />
    ) : (
        <Translation id="earn.rewards" />
    );

    return (
        <PressableOpacity onPress={() => handleToggleBottomSheet(true)}>
            <Card>
                <Box style={applyStyle(stakingWrapperStyle)}>
                    <Box flex={1}>
                        <Box style={applyStyle(stakingItemStyle)}>
                            <Icon name="lock" color="contentSecondary" size="medium" />
                            <Text color="contentSecondary" variant="body-xs">
                                <Translation id="earn.staked" />
                            </Text>
                        </Box>
                        <CryptoAmountFormatter
                            value={stakedBalance}
                            symbol={symbol}
                            decimals={CRYPTO_BALANCE_DECIMALS}
                            color="contentPrimary"
                            variant="headline-sm"
                        />
                        <Box flexDirection="row">
                            <Text color="contentSecondary">≈</Text>
                            <CryptoToFiatAmountFormatter
                                value={stakedBalance}
                                symbol={symbol}
                                color="contentSecondary"
                                isBalance
                            />
                        </Box>
                    </Box>
                    <Box flex={1}>
                        <Box style={applyStyle(stakingItemStyle)}>
                            <Icon name="plusCircle" color="contentSecondary" size="medium" />
                            <Text color="contentSecondary" variant="body-xs">
                                {rewardsTitle}
                            </Text>
                        </Box>
                        <CryptoAmountFormatter
                            value={rewardsBalance}
                            symbol={symbol}
                            decimals={CRYPTO_BALANCE_DECIMALS}
                            color="contentBrand"
                            variant="headline-sm"
                        />
                        <Box flexDirection="row">
                            <Text color="contentSecondary">≈</Text>
                            <CryptoToFiatAmountFormatter
                                value={rewardsBalance}
                                symbol={symbol}
                                color="contentSecondary"
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
                    <Text color="contentSecondary">
                        <Translation id="earn.apy" />
                    </Text>
                    <Text>
                        <ApyValue apy={apy} />
                    </Text>
                </Box>
            </Card>
        </PressableOpacity>
    );
};
