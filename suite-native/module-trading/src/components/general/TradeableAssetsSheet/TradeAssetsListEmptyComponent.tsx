import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const emptyComponentStyle = prepareNativeStyle(({ spacings }) => ({
    padding: spacings.sp52,
    alignContent: 'center',
    justifyContent: 'center',
    gap: spacings.sp12,
}));

export const TradeAssetsListEmptyComponent = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack style={applyStyle(emptyComponentStyle)}>
            <Text variant="body" color="textDefault" textAlign="center">
                <Translation id="moduleTrading.tradeableAssetsSheet.emptyTitle" />
            </Text>
            <Text variant="hint" color="textSubdued" textAlign="center">
                <Translation id="moduleTrading.tradeableAssetsSheet.emptyDescription" />
            </Text>
        </VStack>
    );
};
