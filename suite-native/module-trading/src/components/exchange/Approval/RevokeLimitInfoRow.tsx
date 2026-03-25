import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    cryptoIdToNetworkAndContractAddress,
    selectTradingExchangeActiveQuote,
    tradingExchangeActions,
} from '@suite-common/trading';
import { HStack, Text } from '@suite-native/atoms';
import { CryptoIcon, Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { TradeInfoRow } from '@suite-native/trading-atoms';

import { TradingCoinAmountFormatter } from '../../general/TradingCoinAmountFormatter';

export const RevokeLimitInfoRow = () => {
    const quote = useSelector(selectTradingExchangeActiveQuote);
    const dispatch = useDispatch();

    useEffect(() => {
        if (quote && !quote.approvalType) {
            dispatch(
                tradingExchangeActions.saveSelectedQuote({
                    ...quote,
                    approvalType: 'ZERO',
                }),
            );
        }
    }, [dispatch, quote]);

    if (!quote?.send) {
        return null;
    }

    const { send, preapprovedStringAmount } = quote;
    const { network, contractAddress } = cryptoIdToNetworkAndContractAddress(send);

    return (
        <TradeInfoRow testID="ExchangeApproval/LimitRevoke">
            <Text variant="body-sm">
                <Translation id="moduleTrading.tradingExchangeRevokeScreen.limitLabel" />
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
                    color="textDefault"
                />
                <Icon name="arrowRight" size="medium" color="iconSubdued" />
                <TradingCoinAmountFormatter
                    amount="0"
                    cryptoId={send}
                    variant="body-sm-strong"
                    color="textDefault"
                />
            </HStack>
        </TradeInfoRow>
    );
};
