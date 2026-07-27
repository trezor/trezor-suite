import { useSelector } from 'react-redux';

import {
    cryptoIdToNetworkAndContractAddress,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';
import { HStack, Text } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { TradeInfoRow } from '@suite-native/trading-atoms';

import { hasPreapprovedLimit } from '../../../utils/exchange/quotesUtils';
import { TradingCoinAmountFormatter } from '../../general/TradingCoinAmountFormatter';

export const OriginalLimit = () => {
    const quote = useSelector(selectTradingExchangeSelectedQuote);

    if (!quote?.send || !hasPreapprovedLimit(quote)) {
        return null;
    }

    const { send, preapprovedStringAmount } = quote;
    const { network, contractAddress } = cryptoIdToNetworkAndContractAddress(send);

    return (
        <TradeInfoRow testID="ExchangeApproval/OriginalLimit">
            <Text variant="body-sm" color="contentSecondary">
                <Translation id="moduleTrading.tradingExchangeApprovalScreen.currentLimitLabel" />
            </Text>
            <HStack alignItems="center">
                {!!network?.symbol && (
                    <TokenIcon
                        symbol={network.symbol}
                        contractAddress={contractAddress}
                        size="extraSmall"
                    />
                )}
                <TradingCoinAmountFormatter
                    amount={preapprovedStringAmount}
                    cryptoId={send}
                    variant="body-sm-strong"
                    color="contentPrimary"
                />
            </HStack>
        </TradeInfoRow>
    );
};
