import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { Box, Card, PressableOpacity, Text, VStack } from '@suite-native/atoms';
import { CryptoIconWithNetwork, Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { selectApy, useSelector as useStakingSelector } from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { CRYPTO_BALANCE_DECIMALS } from '../constants';
import { type EarnDepositsCardActiveItem } from '../types';

const itemCardStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.sp16,
}));

const rowStyle = prepareNativeStyle(utils => ({
    paddingLeft: utils.spacings.sp16,
    paddingRight: utils.spacings.sp12,
    paddingVertical: utils.spacings.sp12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 70,
}));

const contentStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

const valuesStyle = prepareNativeStyle(utils => ({
    alignItems: 'flex-end',
    paddingLeft: utils.spacings.sp8,
}));

export const formatActiveItemBalance = (item: EarnDepositsCardActiveItem) => {
    const maxDecimals = item.type === 'staking' ? CRYPTO_BALANCE_DECIMALS : 2;
    const balanceValue = Number(item.balance);
    const formattedValue = Number.isNaN(balanceValue)
        ? item.balance
        : balanceValue.toLocaleString(undefined, {
              maximumFractionDigits: maxDecimals,
          });

    return `${formattedValue} ${item.type === 'staking' ? item.symbol.toUpperCase() : item.tokenSymbol}`;
};

type EarnAccountCardProps = {
    item: EarnDepositsCardActiveItem;
    onPress: () => void;
};

export const EarnAccountCard = ({ item, onPress }: EarnAccountCardProps) => {
    const { applyStyle } = useNativeStyles();
    const isStakingItem = item.type === 'staking';
    const isStablecoinYieldItem = item.type === 'stablecoin-yield';

    const apy = useStakingSelector(state =>
        isStakingItem
            ? selectApy(state, { accountKey: item.accountKey, networkSymbol: item.symbol })
            : null,
    );

    const apyValue = isStakingItem ? apy : item.apy;
    const symbol = isStakingItem ? item.symbol : item.networkSymbol;
    const contractAddress = isStakingItem ? undefined : item.contractAddress;
    const secondaryDescription = isStablecoinYieldItem
        ? item.accountLabel || getNetworkDisplaySymbolName(item.networkSymbol)
        : null;

    return (
        <Card borderColor="borderElevation1" noPadding style={applyStyle(itemCardStyle)}>
            <PressableOpacity onPress={onPress} style={applyStyle(rowStyle)}>
                <Box marginRight="sp12">
                    <CryptoIconWithNetwork
                        symbol={symbol}
                        contractAddress={contractAddress}
                        size="extraSmall"
                    />
                </Box>

                <VStack spacing="sp2" style={applyStyle(contentStyle)}>
                    <Text>{item.title}</Text>
                    {secondaryDescription && (
                        <Text variant="body-sm" color="textSubdued">
                            {secondaryDescription}
                        </Text>
                    )}
                </VStack>

                <VStack spacing="sp2" style={applyStyle(valuesStyle)}>
                    <Text variant="body-md">{formatActiveItemBalance(item)}</Text>
                    {apyValue != null && (
                        <Text variant="body-sm" color="textSubdued">
                            <Translation id="earn.apyPercentage" values={{ apy: apyValue }} />
                        </Text>
                    )}
                </VStack>

                <Box marginLeft="sp12">
                    <Icon name="caretRight" size="mediumLarge" color="iconSubdued" />
                </Box>
            </PressableOpacity>
        </Card>
    );
};
