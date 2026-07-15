import { useSelector } from 'react-redux';

import {
    cryptoIdToNetworkAndContractAddress,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';
import { findToken, isAllowanceUnlimited } from '@suite-common/wallet-utils';
import { HStack, Text } from '@suite-native/atoms';
import { CryptoIcon, Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { TradeInfoRow } from '@suite-native/trading-atoms';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

import { UnlimitedAllowanceLabel } from './UnlimitedAllowanceLabel';
import { TradingCoinAmountFormatter } from '../../general/TradingCoinAmountFormatter';

export const RevokeLimitInfoRow = () => {
    const quote = useSelector(selectTradingExchangeSelectedQuote);
    const sendAccount = useSelector(selectExchangeSelectedSendAccount);

    if (!quote?.send) {
        return null;
    }

    const { send, preapprovedStringAmount } = quote;
    const { network, contractAddress } = cryptoIdToNetworkAndContractAddress(send);
    const { decimals } = findToken(sendAccount?.tokens, contractAddress) ?? {};

    const showUnlimitedAllowanceLabel =
        preapprovedStringAmount &&
        typeof decimals === 'number' &&
        isAllowanceUnlimited({ amount: preapprovedStringAmount, decimals });

    return (
        <TradeInfoRow testID="ExchangeApproval/LimitRevoke">
            <Text variant="body-sm" color="contentSecondary">
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
                {showUnlimitedAllowanceLabel ? (
                    <UnlimitedAllowanceLabel />
                ) : (
                    <TradingCoinAmountFormatter
                        amount={preapprovedStringAmount}
                        cryptoId={send}
                        variant="body-sm-strong"
                        color="contentPrimary"
                    />
                )}
                <Icon name="arrowRight" size="medium" color="contentSecondary" />
                <TradingCoinAmountFormatter
                    amount="0"
                    cryptoId={send}
                    variant="body-sm-strong"
                    color="contentPrimary"
                />
            </HStack>
        </TradeInfoRow>
    );
};
