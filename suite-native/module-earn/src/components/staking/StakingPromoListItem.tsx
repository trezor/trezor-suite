import { useSelector } from 'react-redux';

import { useStakingRate } from '@suite-common/earn-staking';
import { type StakingProductDescriptor } from '@suite-common/earn-staking-common';
import { useFormatters } from '@suite-common/formatters';
import {
    type NetworkSymbol,
    type NetworksRootState,
    selectNativeTokenName,
} from '@suite-common/networks';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { Box, BoxSkeleton, HStack, PressableOpacity, Text } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ApyValue } from '../earn/ApyValue';

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
    descriptor: StakingProductDescriptor;
    onPress: (symbol: NetworkSymbol) => void;
};

export const StakingPromoListItem = ({ descriptor, onPress }: StakingPromoListItemProps) => {
    const { networkSymbol, rateKind } = descriptor;
    const { PercentageFormatter } = useFormatters();
    const { applyStyle } = useNativeStyles();
    const nativeTokenName = useSelector((state: NetworksRootState) =>
        selectNativeTokenName(state, networkSymbol),
    );
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const { rate, isPending } = useStakingRate({ productId: descriptor.id });

    const onPromoItemPress = () => onPress(networkSymbol);

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
                        <TokenIcon
                            networkSymbol={networkSymbol}
                            tokenSymbol={networkSymbol}
                            showNetworkIcon
                        />
                    </Box>

                    <Box style={applyStyle(accountDescriptionStyle)}>
                        <Text>{nativeTokenName}</Text>
                    </Box>
                </Box>

                {isDiscoveryRunning ? (
                    <BoxSkeleton width={70} height={20} />
                ) : (
                    <Box style={applyStyle(valuesContainerStyle)}>
                        {!isPending && (
                            <Text variant="body-md" color="contentPrimary">
                                {rate !== null && isApyAvailable(rate) ? (
                                    <Translation
                                        id={
                                            rateKind === 'apr'
                                                ? 'earn.aprPercentage'
                                                : 'earn.apyPercentage'
                                        }
                                        values={{ apy: PercentageFormatter.format(rate) }}
                                    />
                                ) : (
                                    <ApyValue apy={null} withLabel rateType={rateKind} />
                                )}
                            </Text>
                        )}
                    </Box>
                )}
            </HStack>
        </PressableOpacity>
    );
};
