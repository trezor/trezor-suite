import React from 'react';

import { useFormatters } from '@suite-common/formatters';
import { Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useTradeableAssetsSheetControls } from '../../hooks/useTradeableAssetsSheetControls';
import { SelectTradeableAssetButton } from '../general/SelectTradeableAssetButton';
import { TradeableAssetsSheet } from '../general/TradeableAssetsSheet/TradeableAssetsSheet';
import { TradingOverviewRow } from '../general/TradingOverviewRow';

const notImplementedCallback = () => {
    // eslint-disable-next-line no-console
    console.log('Not implemented');
};

const buySectionStyle = prepareNativeStyle(({ borders, colors, spacings }) => ({
    borderBottomWidth: borders.widths.small,
    borderBottomColor: colors.backgroundSurfaceElevation0,
    padding: spacings.sp20,
}));

export const BuyCard = () => {
    const { translate } = useTranslate();
    const { FiatAmountFormatter, CryptoAmountFormatter } = useFormatters();
    const { applyStyle } = useNativeStyles();

    const {
        isTradeableAssetsSheetVisible,
        showTradeableAssetsSheet,
        hideTradeableAssetsSheet,
        selectedTradeableAsset,
        setSelectedTradeableAsset,
    } = useTradeableAssetsSheetControls();

    return (
        <Card noPadding>
            <VStack style={applyStyle(buySectionStyle)}>
                <Text variant="body" color="textDefault">
                    <Translation id="moduleTrading.tradingScreen.buyTitle" />
                </Text>
                <HStack justifyContent="space-between" alignItems="center">
                    <SelectTradeableAssetButton
                        onPress={showTradeableAssetsSheet}
                        selectedAsset={selectedTradeableAsset}
                    />
                    <Text variant="titleMedium" color="textDisabled">
                        0.0
                    </Text>
                </HStack>
                <HStack justifyContent="space-between" alignItems="center">
                    <Text variant="body" color="textSubdued">
                        {selectedTradeableAsset?.symbol ? (
                            <CryptoAmountFormatter
                                value="0"
                                symbol={selectedTradeableAsset.symbol}
                            />
                        ) : (
                            '-'
                        )}
                    </Text>
                    <HStack>
                        <Text variant="body" color="textSubdued">
                            <FiatAmountFormatter value={0} />
                        </Text>
                        <Icon name="arrowsDownUp" color="iconSubdued" />
                    </HStack>
                </HStack>
            </VStack>
            <TradingOverviewRow
                title={translate('moduleTrading.tradingScreen.receiveAccount')}
                onPress={notImplementedCallback}
                noBottomBorder
            >
                <VStack spacing={0} paddingLeft="sp20">
                    <Text color="textSubdued" variant="body" textAlign="right">
                        Bitcoin Vault
                    </Text>
                    <Text color="textSubdued" variant="hint" ellipsizeMode="tail" numberOfLines={1}>
                        3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC
                    </Text>
                </VStack>
            </TradingOverviewRow>
            <TradeableAssetsSheet
                isVisible={isTradeableAssetsSheetVisible}
                onClose={hideTradeableAssetsSheet}
                onAssetSelect={setSelectedTradeableAsset}
            />
        </Card>
    );
};
