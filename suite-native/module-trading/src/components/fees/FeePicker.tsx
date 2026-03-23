import { type NetworkSymbol } from '@suite-common/wallet-config';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { TradeInfoRow } from '@suite-native/trading-atoms';

type FeePickerProps = {
    fee: string;
    symbol: NetworkSymbol;
    onPress: () => void;
    isLoading?: boolean;
    noBorder?: boolean;
};

export const FEE_PICKER_TEST_ID = '@trading/fees/fee-picker';

export const FeePicker = ({
    fee,
    symbol,
    onPress,
    isLoading = false,
    noBorder,
}: FeePickerProps) => (
    <TradeInfoRow onPress={onPress} testID={FEE_PICKER_TEST_ID} noBorder={noBorder}>
        <Text variant="body-sm">
            <Translation id="moduleTrading.tradingExchangePreviewScreen.maximumFeeLabel" />
        </Text>
        <HStack alignItems="center">
            <VStack alignItems="flex-end" spacing="sp2">
                <CryptoAmountFormatter
                    value={fee}
                    symbol={symbol}
                    isBalance={false}
                    isLoading={isLoading}
                    variant="body-sm"
                    color="textDefault"
                />
                <HStack alignItems="center" spacing="sp8">
                    {!isLoading && (
                        <Text variant="body-sm" color="textSubdued">
                            ≈
                        </Text>
                    )}
                    <CryptoToFiatAmountFormatter
                        variant="body-sm"
                        color="textSubdued"
                        value={fee}
                        symbol={symbol}
                        isLoading={isLoading}
                    />
                </HStack>
            </VStack>
            <Icon name="caretDown" size="medium" testID="caret-down-icon" />
        </HStack>
    </TradeInfoRow>
);
