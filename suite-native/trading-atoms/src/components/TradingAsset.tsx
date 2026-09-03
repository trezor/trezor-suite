import { type ReactNode } from 'react';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type NativeSpacing, type NativeTypographyStyle } from '@trezor/theme';

import { FiatCurrencyIcon, type FiatCurrencyIconProps } from './FiatCurrencyIcon';
import { NetworkBadge } from './NetworkBadge';

export type TradingAssetPrimaryLabel = 'name' | 'symbol';
export type TradingAssetNetworkDisplay = 'badge' | 'text';

type TradingAssetBaseProps = {
    iconSize?: FiatCurrencyIconProps['size'];
    name: string;
    primaryLabel?: TradingAssetPrimaryLabel;
    primaryTextVariant?: NativeTypographyStyle;
    rightContent?: ReactNode;
    spacing?: NativeSpacing | number;
    symbol: string;
    testID?: string;
};

export type TradingCryptoAssetProps = TradingAssetBaseProps & {
    assetType: 'crypto';
    contractAddress?: string;
    networkDisplay?: TradingAssetNetworkDisplay;
    networkSymbol: NetworkSymbol;
};

export type TradingFiatAssetProps = TradingAssetBaseProps & {
    assetType: 'fiat';
    fiatCurrency: NonNullable<FiatCurrencyIconProps['value']>;
};

export type TradingAssetProps = TradingCryptoAssetProps | TradingFiatAssetProps;

const rightContentStyle = prepareNativeStyle(() => ({
    maxWidth: '50%',
    justifyContent: 'center',
}));

export const TradingAsset = (props: TradingAssetProps) => {
    const { applyStyle } = useNativeStyles();
    const {
        iconSize = 'medium',
        name,
        primaryLabel = 'name',
        primaryTextVariant = 'body-md',
        rightContent,
        spacing = 'sp8',
        symbol,
        testID,
        assetType,
    } = props;

    const primaryText = primaryLabel === 'name' ? name : symbol;
    const shouldShowSymbolOnSecondaryLine = primaryLabel === 'name';
    const shouldShowSecondaryLine = shouldShowSymbolOnSecondaryLine || assetType === 'crypto';

    return (
        <HStack alignItems="center" spacing={spacing} testID={testID}>
            {assetType === 'crypto' ? (
                <TokenIcon
                    symbol={props.networkSymbol}
                    contractAddress={props.contractAddress}
                    showNetworkIcon
                    size={iconSize}
                />
            ) : (
                <FiatCurrencyIcon size={iconSize} value={props.fiatCurrency} />
            )}
            <VStack flex={1} justifyContent="center" spacing={0}>
                <Text
                    color="contentPrimary"
                    numberOfLines={1}
                    testID={testID ? `${testID}/primary-label` : undefined}
                    variant={primaryTextVariant}
                >
                    {primaryText}
                </Text>
                {shouldShowSecondaryLine && (
                    <HStack alignItems="center" justifyContent="flex-start" spacing="sp4">
                        {shouldShowSymbolOnSecondaryLine && (
                            <Text
                                color="contentSecondary"
                                numberOfLines={1}
                                testID={testID ? `${testID}/secondary-symbol` : undefined}
                                variant="body-sm"
                            >
                                {symbol}
                            </Text>
                        )}
                        {props.assetType === 'crypto' &&
                            (props.networkDisplay === 'text' ? (
                                <Text
                                    color="contentSecondary"
                                    numberOfLines={1}
                                    testID={testID ? `${testID}/network-text` : undefined}
                                    variant="body-sm"
                                >
                                    {getNetwork(props.networkSymbol).name}
                                </Text>
                            ) : (
                                <NetworkBadge symbol={props.networkSymbol} />
                            ))}
                    </HStack>
                )}
            </VStack>
            {rightContent && (
                <Box
                    style={applyStyle(rightContentStyle)}
                    testID={testID ? `${testID}/right-content` : undefined}
                >
                    {rightContent}
                </Box>
            )}
        </HStack>
    );
};
