import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ReceiveAccountCryptoBalance } from './ReceiveAccountCryptoBalance';
import { ReceiveAccountPicker } from './ReceiveAccountPicker';
import { TradeableAssetPicker } from './TradeableAssetPicker';
import { useTradeSheetControls } from '../../hooks/useTradeSheetControls';
import { selectBuySelectedReceiveAccount, setBuySelectedReceiveAccount } from '../../tradingSlice';
import { TradeableAsset } from '../../types';

const buySectionStyle = prepareNativeStyle(({ borders, colors, spacings }) => ({
    borderBottomWidth: borders.widths.small,
    borderBottomColor: colors.backgroundSurfaceElevation0,
    padding: spacings.sp20,
    gap: spacings.sp20,
}));

export const BuyCard = () => {
    const { FiatAmountFormatter } = useFormatters();
    const { applyStyle } = useNativeStyles();
    const dispatch = useDispatch();
    const selectedReceiveAccount = useSelector(selectBuySelectedReceiveAccount);

    const { selectedValue: selectedAsset, ...restAssetControls } =
        useTradeSheetControls<TradeableAsset>();

    const selectedSymbol = selectedAsset?.symbol;

    useEffect(() => {
        dispatch(setBuySelectedReceiveAccount({ selectedReceiveAccount: undefined }));
    }, [dispatch, selectedSymbol]);

    return (
        <Card noPadding>
            <VStack style={applyStyle(buySectionStyle)}>
                <Text variant="body" color="textDefault">
                    <Translation id="moduleTrading.tradingScreen.buyTitle" />
                </Text>
                <HStack justifyContent="space-between" alignItems="center">
                    <TradeableAssetPicker selectedValue={selectedAsset} {...restAssetControls} />
                    <Text variant="titleMedium" color="textDisabled">
                        0.0
                    </Text>
                </HStack>
                <HStack justifyContent="space-between" alignItems="center">
                    <ReceiveAccountCryptoBalance
                        symbol={selectedReceiveAccount?.account?.symbol}
                        balance={selectedReceiveAccount?.account?.balance}
                    />
                    <HStack>
                        <Text variant="body" color="textSubdued">
                            <FiatAmountFormatter value={0} />
                        </Text>
                        <Icon name="arrowsDownUp" color="iconSubdued" />
                    </HStack>
                </HStack>
            </VStack>
            <ReceiveAccountPicker selectedSymbol={selectedSymbol} />
        </Card>
    );
};
