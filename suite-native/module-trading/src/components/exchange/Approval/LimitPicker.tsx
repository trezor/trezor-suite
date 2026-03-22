import { useSelector } from 'react-redux';

import {
    cryptoIdToNetworkAndContractAddress,
    selectTradingExchangeActiveQuote,
} from '@suite-common/trading';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoIcon, Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { TradeInfoRow } from '@suite-native/trading-atoms';

import { ExchangeApprovalLimitSheet } from './ExchangeApprovalLimitSheet/ExchangeApprovalLimitSheet';
import { LimitPickerUnlimitedAlert } from './LimitPickerUnlimitedAlert';
import { useApprovalTypeControls } from '../../../hooks/exchange/Approval/useApprovalTypeControls';
import { TradingCoinAmountFormatter } from '../../general/TradingCoinAmountFormatter';

export const LimitPicker = () => {
    const quote = useSelector(selectTradingExchangeActiveQuote);

    const { approvalType, isSheetVisible, showSheet, hideSheet, handleApprovalTypeChange } =
        useApprovalTypeControls(quote);

    if (!quote?.send) {
        return null;
    }

    const { send, sendStringAmount } = quote;
    const { network, contractAddress } = cryptoIdToNetworkAndContractAddress(send);
    const isInfinite = approvalType === 'INFINITE';

    return (
        <>
            <TradeInfoRow onPress={showSheet} testID="ExchangeApproval/LimitPicker">
                <VStack>
                    <HStack justifyContent="space-between" alignItems="center">
                        <Text variant="body-sm">
                            <Translation id="moduleTrading.tradingExchangeApprovalScreen.limitLabel" />
                        </Text>
                        <HStack alignItems="center">
                            {!!network?.symbol && (
                                <CryptoIcon
                                    symbol={network.symbol}
                                    contractAddress={contractAddress}
                                    size="extraSmall"
                                />
                            )}
                            {isInfinite ? (
                                <Text variant="body-sm-strong">
                                    <Translation id="moduleTrading.tradingExchangeApprovalScreen.unlimitedLabel" />
                                </Text>
                            ) : (
                                <TradingCoinAmountFormatter
                                    amount={sendStringAmount}
                                    cryptoId={send}
                                    variant="body-sm-strong"
                                />
                            )}

                            <Icon name="caretDown" size="medium" />
                        </HStack>
                    </HStack>
                    <Text variant="body-sm" color="textSubdued">
                        {isInfinite ? (
                            <Translation id="moduleTrading.exchangeApprovalLimitSheet.unlimitedCard.info" />
                        ) : (
                            <Translation id="moduleTrading.exchangeApprovalLimitSheet.limitedCard.info" />
                        )}
                    </Text>
                    {isInfinite ? <LimitPickerUnlimitedAlert cryptoId={quote.send} /> : null}
                </VStack>
            </TradeInfoRow>
            <ExchangeApprovalLimitSheet
                isVisible={isSheetVisible}
                onDismiss={hideSheet}
                onApprovalTypeSelect={handleApprovalTypeChange}
                selectedApprovalType={approvalType}
                quote={quote}
            />
        </>
    );
};
