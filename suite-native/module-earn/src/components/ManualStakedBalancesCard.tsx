import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box, Card, PressableOpacity, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { selectStakedBalanceByAccountKey, useSelector } from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

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
                            <Icon name="lock" color="textSubdued" size="medium" />
                            <Text color="textSubdued" variant="body-xs">
                                <Translation id="earn.staked" />
                            </Text>
                        </Box>
                        <CryptoAmountFormatter
                            value={stakedBalance}
                            symbol={symbol}
                            decimals={CRYPTO_BALANCE_DECIMALS}
                            color="textDefault"
                            variant="headline-sm"
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
                            <Text color="textSubdued" variant="body-xs">
                                {rewardsTitle}
                            </Text>
                        </Box>
                        <CryptoAmountFormatter
                            value={rewardsBalance}
                            symbol={symbol}
                            decimals={CRYPTO_BALANCE_DECIMALS}
                            color="textSecondaryHighlight"
                            variant="headline-sm"
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
                        <Translation id="earn.apy" />
                    </Text>
                    <Text>{apy ? `${apy}%` : <Translation id="earn.notAvailable" />}</Text>
                </Box>
            </Card>
        </PressableOpacity>
    );
};
