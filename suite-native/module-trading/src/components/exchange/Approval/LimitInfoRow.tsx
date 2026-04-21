import type { PropsWithChildren } from 'react';
import { useSelector } from 'react-redux';

import {
    cryptoIdToNetworkAndContractAddress,
    selectTradingExchangeActiveQuote,
} from '@suite-common/trading';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoIcon, Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { TradeInfoRow } from '@suite-native/trading-atoms';

import { hasPreapprovedLimit } from '../../../utils/exchange/quotesUtils';
import { TradingCoinAmountFormatter } from '../../general/TradingCoinAmountFormatter';

type LimitInfoRowProps = PropsWithChildren<{
    onPress?: () => void;
    testID?: string;
    withCaret?: boolean;
}>;

export const LimitInfoRow = ({ onPress, testID, withCaret, children }: LimitInfoRowProps) => {
    const quote = useSelector(selectTradingExchangeActiveQuote);

    if (!quote?.send) {
        return null;
    }

    const { send, sendStringAmount, approvalType } = quote;
    const { network, contractAddress } = cryptoIdToNetworkAndContractAddress(send);

    return (
        <TradeInfoRow onPress={onPress} testID={testID}>
            <VStack flex={1}>
                <HStack justifyContent="space-between" alignItems="center">
                    <Text variant="body-sm">
                        {hasPreapprovedLimit(quote) ? (
                            <Translation id="moduleTrading.tradingExchangeApprovalScreen.newLimitLabel" />
                        ) : (
                            <Translation id="moduleTrading.tradingExchangeApprovalScreen.limitLabel" />
                        )}
                    </Text>
                    <HStack alignItems="center">
                        {!!network?.symbol && (
                            <CryptoIcon
                                symbol={network.symbol}
                                contractAddress={contractAddress}
                                size="extraSmall"
                            />
                        )}
                        {approvalType === 'INFINITE' ? (
                            <Text variant="body-sm-strong">
                                <Translation id="moduleTrading.tradingExchangeApprovalScreen.unlimitedLabel" />
                            </Text>
                        ) : (
                            <TradingCoinAmountFormatter
                                amount={sendStringAmount}
                                cryptoId={send}
                                variant="body-sm-strong"
                                color="contentPrimary"
                            />
                        )}
                        {withCaret && <Icon name="caretDown" size="medium" />}
                    </HStack>
                </HStack>
                {children}
            </VStack>
        </TradeInfoRow>
    );
};
