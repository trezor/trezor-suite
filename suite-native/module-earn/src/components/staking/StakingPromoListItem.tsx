import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/networks';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { Box, BoxSkeleton, HStack, PressableOpacity, Text } from '@suite-native/atoms';
import { NetworkDisplaySymbolNameFormatter } from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useStakingRate } from '../../hooks/staking/useStakingRate';

const promoItemStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.sp12,
    minHeight: 70,
}));

const accountDescriptionStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
}));

const valuesContainerStyle = prepareNativeStyle(utils => ({
    maxWidth: '40%',
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: utils.spacings.sp8,
}));

type StakingPromoListItemProps = {
    symbol: NetworkSymbol;
    onPress: (symbol: NetworkSymbol) => void;
};

export const StakingPromoListItem = ({ symbol, onPress }: StakingPromoListItemProps) => {
    const { applyStyle } = useNativeStyles();
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const { rate } = useStakingRate({ symbol });

    const onPromoItemPress = () => onPress(symbol);

    return (
        <PressableOpacity style={applyStyle(promoItemStyle)} onPress={onPromoItemPress}>
            <HStack
                flex={1}
                justifyContent="space-between"
                alignItems="center"
                paddingHorizontal="sp16"
            >
                <Box flexDirection="row" alignItems="center" flex={1}>
                    <Box marginRight="sp16">
                        <TokenIcon networkSymbol={symbol} tokenSymbol={symbol} showNetworkIcon />
                    </Box>

                    <Box style={applyStyle(accountDescriptionStyle)}>
                        <Text>
                            <NetworkDisplaySymbolNameFormatter value={symbol} />
                        </Text>
                    </Box>
                </Box>

                {isDiscoveryRunning ? (
                    <BoxSkeleton width={70} height={20} />
                ) : (
                    <Box style={applyStyle(valuesContainerStyle)}>
                        {rate != null && (
                            <Text variant="body-md" color="contentPrimary">
                                {isApyAvailable(rate) ? (
                                    <Translation
                                        id={
                                            symbol === 'trx'
                                                ? 'earn.aprPercentage'
                                                : 'earn.apyPercentage'
                                        }
                                        values={{ apy: rate }}
                                    />
                                ) : (
                                    <Translation id="earn.notAvailableShort" />
                                )}
                            </Text>
                        )}
                    </Box>
                )}
            </HStack>
        </PressableOpacity>
    );
};
