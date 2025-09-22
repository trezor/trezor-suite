import { NetworkSymbol } from '@suite-common/wallet-config';
import { HStack, Text } from '@suite-native/atoms';
import { CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { TradeInfoRow } from '../TradeInfo/TradeInfoRow';

type FeePickerProps = {
    fee: string;
    symbol: NetworkSymbol;
    onPress: () => void;
    isLoading?: boolean;
};

export const FEE_PICKER_TEST_ID = '@trading/fees/fee-picker';

export const FeePicker = ({ fee, symbol, onPress, isLoading = false }: FeePickerProps) => (
    <TradeInfoRow onPress={onPress} testID={FEE_PICKER_TEST_ID}>
        <Text variant="hint">
            <Translation id="moduleTrading.tradingExchangePreviewScreen.feeLabel" />
        </Text>
        <HStack alignItems="center" spacing="sp8">
            {!isLoading && (
                <Text variant="hint" color="textSubdued">
                    ≈
                </Text>
            )}
            <CryptoToFiatAmountFormatter
                variant="body"
                color="textDefault"
                value={fee}
                symbol={symbol}
                isLoading={isLoading}
            />
            <Icon name="caretRight" size="medium" testID="caret-right-icon" />
        </HStack>
    </TradeInfoRow>
);
