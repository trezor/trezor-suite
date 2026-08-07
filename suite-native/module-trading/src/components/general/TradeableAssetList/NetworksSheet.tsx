import { useCallback, useMemo } from 'react';
import { Dimensions } from 'react-native';

import { type Network, type NetworkSymbol } from '@suite-common/wallet-config';
import {
    BottomSheetFlashList,
    type BottomSheetFlashListHandleProps,
    Box,
    Button,
    Divider,
    HStack,
    PressableOpacity,
    Text,
} from '@suite-native/atoms';
import { Icon, NetworkIcon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { SimpleSheetHeader } from '../SimpleSheetHeader';

export type NetworksSheetProps = {
    isVisible: boolean;
    networks: Network[];
    selectedNetwork: NetworkSymbol | undefined;
    onClose: () => void;
    onSelectNetwork: (symbol: NetworkSymbol | undefined) => void;
    testID?: string;
};

type NetworkRowProps = {
    isFirst: boolean;
    isLast: boolean;
    isSelected: boolean;
    name: string;
    onPress: () => void;
    symbol?: NetworkSymbol;
    testID?: string;
};

type NetworkOption = {
    name: string;
    symbol: NetworkSymbol | undefined;
};
const SHEET_HEIGHT = Dimensions.get('window').height * 0.9;

const networkRowStyle = prepareNativeStyle<{ isFirst: boolean; isLast: boolean }>(
    (utils, { isFirst, isLast }) => ({
        paddingHorizontal: utils.spacings.sp20,
        paddingVertical: utils.spacings.sp16,
        backgroundColor: utils.colors.surfaceFillRaised,
        borderTopLeftRadius: isFirst ? utils.borders.radii.r16 : 0,
        borderTopRightRadius: isFirst ? utils.borders.radii.r16 : 0,
        borderBottomLeftRadius: isLast ? utils.borders.radii.r16 : 0,
        borderBottomRightRadius: isLast ? utils.borders.radii.r16 : 0,
    }),
);

const keyExtractor = ({ symbol }: NetworkOption) => symbol ?? 'all-networks';

const NetworkRow = ({
    isFirst,
    isLast,
    isSelected,
    name,
    onPress,
    symbol,
    testID,
}: NetworkRowProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <PressableOpacity
            accessibilityLabel={name}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            onPress={onPress}
            style={applyStyle(networkRowStyle, { isFirst, isLast })}
            testID={testID}
        >
            <HStack alignItems="center" justifyContent="space-between">
                <HStack alignItems="center" spacing="sp12">
                    {symbol && <NetworkIcon symbol={symbol} size="extraLarge" />}
                    <Text variant="body-md">{name}</Text>
                </HStack>
                {isSelected && (
                    <Icon name="checkCircleFilled" color="contentBrand" size="mediumLarge" />
                )}
            </HStack>
        </PressableOpacity>
    );
};

export const NetworksSheet = ({
    isVisible,
    networks,
    selectedNetwork,
    onClose,
    onSelectNetwork,
    testID,
}: NetworksSheetProps) => {
    const { utils } = useNativeStyles();
    const { translate } = useTranslate();
    const networkOptions = useMemo<NetworkOption[]>(
        () => [
            {
                name: translate('moduleTrading.tradeableAssetsSheet.networksSheet.allNetworks'),
                symbol: undefined,
            },
            ...networks,
        ],
        [networks, translate],
    );

    const renderHandle = useCallback(
        ({ closeSheet }: BottomSheetFlashListHandleProps) => (
            <SimpleSheetHeader
                onClose={closeSheet}
                title={<Translation id="moduleTrading.tradeableAssetsSheet.networksSheet.title" />}
            />
        ),
        [],
    );

    const footer = useMemo(
        () => (
            <Box paddingHorizontal="sp16">
                <Button
                    intent="neutral"
                    priority="secondary"
                    isFullWidth
                    onPress={() => {
                        onSelectNetwork(undefined);
                        onClose();
                    }}
                    testID={testID ? `${testID}/clear-filter` : undefined}
                >
                    <Translation id="moduleTrading.tradeableAssetsSheet.networksSheet.clearFilter" />
                </Button>
            </Box>
        ),
        [onClose, onSelectNetwork, testID],
    );

    return (
        <BottomSheetFlashList<NetworkOption>
            footer={selectedNetwork ? footer : undefined}
            isVisible={isVisible}
            estimatedListHeight={SHEET_HEIGHT}
            onClose={onClose}
            data={networkOptions}
            keyExtractor={keyExtractor}
            ItemSeparatorComponent={Divider}
            handleComponent={renderHandle}
            extraData={selectedNetwork}
            testID={testID}
            contentContainerStyle={{ paddingTop: utils.spacings.sp10 }}
            showEdgeFades
            renderItem={({ item, index }, { closeSheet }) => (
                <NetworkRow
                    name={item.name}
                    symbol={item.symbol}
                    isFirst={index === 0}
                    isLast={index === networkOptions.length - 1}
                    isSelected={item.symbol === selectedNetwork}
                    onPress={() => {
                        onSelectNetwork(item.symbol);
                        closeSheet();
                    }}
                    testID={testID ? `${testID}/${item.symbol ?? 'all'}` : undefined}
                />
            )}
        />
    );
};
