import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box, Card, PressableOpacity, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { selectIsCardanoStakedOutsideEverstake, useSelector } from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ApyValue } from './ApyValue';

const stakingItemStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: utils.spacings.sp4,
    paddingBottom: utils.spacings.sp8,
}));

const infoItemStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: utils.spacings.sp8,
    paddingTop: utils.spacings.sp16,
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

type AutoStakedBalancesCardProps = {
    accountKey: AccountKey;
    symbol: NetworkSymbol | null;
    rewardsBalance: string | null;
    apy: number | null;
    handleToggleBottomSheet: (value: boolean) => void;
};

const CRYPTO_BALANCE_DECIMALS = 5;

export const AutoStakedBalancesCard = ({
    accountKey,
    symbol,
    rewardsBalance,
    apy,
    handleToggleBottomSheet,
}: AutoStakedBalancesCardProps) => {
    const { applyStyle } = useNativeStyles();

    const isAdaStakedOutsideEverstake = useSelector(state =>
        selectIsCardanoStakedOutsideEverstake(state, accountKey),
    );

    if (!symbol) return null;

    return (
        <PressableOpacity onPress={() => handleToggleBottomSheet(true)}>
            <Card>
                <Box style={applyStyle(stakingWrapperStyle)}>
                    <Box flex={1}>
                        <Box style={applyStyle(stakingItemStyle)}>
                            <Icon name="check" color="textSubdued" size="medium" />
                            <Text color="textSubdued" variant="body-xs">
                                <Translation id="earn.stakedAutomatically" />
                            </Text>
                        </Box>

                        <Text color="textDefault" variant="headline-sm">
                            <Translation id="earn.fullBalance" />
                        </Text>
                    </Box>
                    <Box flex={1}>
                        <Box style={applyStyle(stakingItemStyle)}>
                            <Icon name="plusCircle" color="textSubdued" size="medium" />
                            <Text color="textSubdued" variant="body-xs">
                                <Translation id="earn.rewards" />
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
                    <Text>
                        {!isAdaStakedOutsideEverstake && apy ? (
                            <ApyValue apy={apy} />
                        ) : (
                            <Translation id="earn.notAvailable" />
                        )}
                    </Text>
                </Box>

                <Box paddingTop="sp16">
                    <Box style={applyStyle(separatorStyle)} />

                    <Box style={applyStyle(infoItemStyle)}>
                        <Icon name="info" color="textSubdued" size="mediumLarge" />
                        <Box flexShrink={1}>
                            <Text color="textSubdued" variant="body-sm" numberOfLines={0}>
                                <Translation id="earn.adaStaysFullyAccessuble" />
                            </Text>
                        </Box>
                    </Box>
                </Box>
            </Card>
        </PressableOpacity>
    );
};
