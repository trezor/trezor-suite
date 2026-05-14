import { useSelector } from 'react-redux';

import {
    cryptoIdToNetworkAndContractAddress,
    selectTradingExchangeActiveQuote,
} from '@suite-common/trading';
import { HStack, Text } from '@suite-native/atoms';
import { CryptoIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { TradeInfoRow } from '@suite-native/trading-atoms';

import { hasPreapprovedLimit } from '../../../utils/exchange/quotesUtils';
import { TradingCoinAmountFormatter } from '../../general/TradingCoinAmountFormatter';

export const OriginalLimit = () => {
    const quote = useSelector(selectTradingExchangeActiveQuote);

    if (!quote?.send || !hasPreapprovedLimit(quote)) {
        return null;
    }

    const { send, preapprovedStringAmount } = quote;
    const { network, contractAddress } = cryptoIdToNetworkAndContractAddress(send);

    return (
        <TradeInfoRow testID="ExchangeApproval/OriginalLimit">
            <Text variant="body-sm">
                <Translation id="moduleTrading.tradingExchangeApprovalScreen.currentLimitLabel" />
            </Text>
            <HStack alignItems="center">
                {!!network?.symbol && (
                    <CryptoIcon
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
