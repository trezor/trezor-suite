import { useEffect } from 'react';
import { usePrevious } from 'react-use';

import { ExchangeTradeStatus } from 'invity-api';
import styled from 'styled-components';

import { type TradingExchangeType, cryptoIdToNetwork } from '@suite-common/trading';
import { Card, InfoItem } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';

import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { IOAddress } from 'src/components/suite/copy/IOAddress';
import { useDispatch } from 'src/hooks/suite';
import { useTradingDetailContext } from 'src/hooks/wallet/trading/useTradingDetail';
import { tradeFinalStatuses } from 'src/hooks/wallet/trading/useTradingWatchTrade';
import { TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import { TradingDetailExchangePaymentConverting } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchangePaymentConverting';
import { TradingDetailExchangePaymentFailed } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchangePaymentFailed';
import { TradingDetailExchangePaymentKYC } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchangePaymentKYC';
import { TradingDetailExchangePaymentSending } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchangePaymentSending';
import { TradingDetailExchangePaymentSuccessful } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchangePaymentSuccessful';
import { TradingSelectedOfferInfo } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferInfo';
import { TradingWrapper } from 'src/views/wallet/trading/common/TradingWrapper';

const Wrapper = styled.div`
    ${TradingWrapper}
`;

const getTradeStatusStep = (tradeStatus: ExchangeTradeStatus) => {
    switch (tradeStatus) {
        case 'CONVERTING':
            return 'status-converting';
        case 'KYC':
            return 'status-kyc';
        case 'ERROR':
            return 'status-error';
        case 'SUCCESS':
            return 'status-success';
        default: {
            if (!tradeFinalStatuses['exchange'].includes(tradeStatus)) {
                return 'status-sending';
            }

            return undefined;
        }
    }
};

export const TradingDetailExchange = () => {
    const { account, trade, info } = useTradingDetailContext<TradingExchangeType>();
    const dispatch = useDispatch();

    const tradeStatus = trade?.data?.status || 'CONFIRMING';
    const previousTradeStatus = usePrevious(tradeStatus);
    const tradeStatusStep = getTradeStatusStep(tradeStatus);

    const exchange = trade?.data?.exchange;
    const provider =
        info && info.providerInfos && exchange ? info.providerInfos[exchange] : undefined;
    const supportUrlTemplate = provider?.statusUrl || provider?.supportUrl;
    const supportUrl = supportUrlTemplate?.replace('{{orderId}}', trade?.data?.orderId || '');

    const quoteAmounts: TradingGetCryptoQuoteAmountProps = {
        sendAmount: trade?.data?.sendStringAmount ?? '',
        sendCurrency: trade?.data?.send,
        receiveAmount: trade?.data?.receiveStringAmount ?? '',
        receiveCurrency: trade?.data?.receive,
    };

    useEffect(() => {
        // if tradeStatus hasn't changed, don't send the analytics event
        // also safeguard the initial tradeStatus change from undefined to defined
        if (!previousTradeStatus || previousTradeStatus === tradeStatus || !tradeStatusStep) {
            return;
        }

        analytics.report({
            type: EventType.TradingExchange,
            payload: {
                action: 'continue',
                step: tradeStatusStep,
            },
        });
    }, [tradeStatus, previousTradeStatus, tradeStatusStep]);

    // if trade not found, it is because user refreshed the page and stored transactionId got removed
    // go to the default trading page, the trade is shown there in the previous trades
    if (!trade) {
        dispatch(
            goto('wallet-trading-exchange', {
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

        return null;
    }

    const { receiveTxHash, send } = trade.data;
    const network = send && cryptoIdToNetwork(send);

    return (
        <Wrapper>
            <Card>
                {receiveTxHash && (
                    <InfoItem label={<Translation id="TR_TXID" />}>
                        <IOAddress
                            txAddress={receiveTxHash}
                            explorerUrl={network?.explorer.tx}
                            explorerUrlQueryString={network?.explorer.queryString}
                        />
                    </InfoItem>
                )}

                {tradeStatusStep === 'status-success' && (
                    <TradingDetailExchangePaymentSuccessful account={account} />
                )}
                {tradeStatusStep === 'status-kyc' && (
                    <TradingDetailExchangePaymentKYC
                        account={account}
                        provider={provider}
                        supportUrl={supportUrl}
                    />
                )}
                {tradeStatusStep === 'status-error' && (
                    <TradingDetailExchangePaymentFailed
                        account={account}
                        transactionId={trade.key}
                        supportUrl={supportUrl}
                    />
                )}
                {tradeStatusStep === 'status-converting' && (
                    <TradingDetailExchangePaymentConverting supportUrl={supportUrl} />
                )}
                {tradeStatusStep === 'status-sending' && (
                    <TradingDetailExchangePaymentSending supportUrl={supportUrl} />
                )}
            </Card>
            <Card>
                <TradingSelectedOfferInfo
                    selectedQuote={trade.data}
                    transactionId={trade.key}
                    providers={info?.providerInfos}
                    type="exchange"
                    quoteAmounts={quoteAmounts}
                />
            </Card>
        </Wrapper>
    );
};
