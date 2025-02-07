import { useFormatters } from '@suite-common/formatters';
import { Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ReceiveAccountPicker } from './ReceiveAccountPicker';
import { TradeableAssetPicker } from './TradeableAssetPicker';
import { useTradeSheetControls } from '../../hooks/useTradeSheetControls';
import { TradeableAsset } from '../../types';

const buySectionStyle = prepareNativeStyle(({ borders, colors, spacings }) => ({
    borderBottomWidth: borders.widths.small,
    borderBottomColor: colors.backgroundSurfaceElevation0,
    padding: spacings.sp20,
}));

export const BuyCard = () => {
    const { FiatAmountFormatter, CryptoAmountFormatter } = useFormatters();
    const { applyStyle } = useNativeStyles();

    const { selectedValue, ...restControls } = useTradeSheetControls<TradeableAsset>();

    return (
        <Card noPadding>
            <VStack style={applyStyle(buySectionStyle)}>
                <Text variant="body" color="textDefault">
                    <Translation id="moduleTrading.tradingScreen.buyTitle" />
                </Text>
                <HStack justifyContent="space-between" alignItems="center">
                    <TradeableAssetPicker selectedValue={selectedValue} {...restControls} />
                    <Text variant="titleMedium" color="textDisabled">
                        0.0
                    </Text>
                </HStack>
                <HStack justifyContent="space-between" alignItems="center">
                    <Text variant="body" color="textSubdued">
                        {selectedValue?.symbol ? (
                            <CryptoAmountFormatter value="0" symbol={selectedValue.symbol} />
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
            <ReceiveAccountPicker selectedSymbol={selectedValue?.symbol} />
        </Card>
    );
};
