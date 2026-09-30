import { useSelector } from 'react-redux';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { Box, BoxSkeleton, HStack, PressableOpacity, Text } from '@suite-native/atoms';
import { NetworkDisplaySymbolNameFormatter } from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type YieldPromoListItem as YieldPromoListItemType } from '../../types';

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

type YieldPromoListItemProps = {
    item: YieldPromoListItemType;
    onPress: (item: YieldPromoListItemType) => void;
};

export const YieldPromoListItem = ({ item, onPress }: YieldPromoListItemProps) => {
    const { applyStyle } = useNativeStyles();

    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    return (
        <PressableOpacity style={applyStyle(promoItemStyle)} onPress={() => onPress(item)}>
            <HStack
                flex={1}
                justifyContent="space-between"
                alignItems="center"
                paddingHorizontal="sp16"
            >
                <Box flexDirection="row" alignItems="center" flex={1}>
                    <Box marginRight="sp16">
                        <TokenIcon
                            networkSymbol={item.networkSymbol}
                            tokenSymbol={item.tokenSymbol}
                            contractAddress={item.tokenContractAddress}
                            wrappedTokenIcon="network"
                            showNetworkIcon
                        />
                    </Box>

                    <Box style={applyStyle(accountDescriptionStyle)}>
                        <Text>{item.vaultName}</Text>

                        <Text color="contentSecondary" variant="body-sm">
                            <NetworkDisplaySymbolNameFormatter value={item.networkSymbol} />
                        </Text>
                    </Box>
                </Box>

                {isDiscoveryRunning ? (
                    <BoxSkeleton width={70} height={20} />
                ) : (
                    <Box style={applyStyle(valuesContainerStyle)}>
                        {item.apy != null && (
                            <Text variant="body-md" color="contentPrimary">
                                {isApyAvailable(item.apy) ? (
                                    <Translation
                                        id="earn.apyPercentage"
                                        values={{ apy: item.apy }}
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
