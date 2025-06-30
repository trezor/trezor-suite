import { useEffect } from 'react';
import { usePrevious } from 'react-use';

import { ExchangeTradeStatus } from 'invity-api';
import styled from 'styled-components';

import { type TradingExchangeType, cryptoIdToNetwork } from '@suite-common/trading';
import { getExplorerUrl } from '@suite-common/wallet-config';
import { selectAccounts, selectExplorer } from '@suite-common/wallet-core';
import { Card, Column, InfoItem } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { TxAddress } from 'src/components/suite/copy/TxAddress';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingDetailContext } from 'src/hooks/wallet/trading/useTradingDetail';
import { tradeFinalStatuses } from 'src/hooks/wallet/trading/useTradingWatchTrade';
import { TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import { TradingDetailExchangePaymentConverting } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchangePaymentConverting';
import { TradingDetailExchangePaymentFailed } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchangePaymentFailed';
import { TradingDetailExchangePaymentKYC } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchangePaymentKYC';
import { TradingDetailExchangePaymentSending } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchangePaymentSending';
import { TradingDetailExchangePaymentSuccessful } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchangePaymentSuccessful';
import { TradingDetailFeedback } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailFeedback';
import { TradingSelectedOfferInfo } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferInfo';
import { TradingWrapper } from 'src/views/wallet/trading/common/TradingWrapper';

const Wrapper = styled.div`
    ${TradingWrapper}
`;

const getTradeStatusStep = (tradeStatus: ExchangeTradeStatus) => {
    switch (tradeStatus) {
        case 'CONVERTING':
            return 'converting';
        case 'KYC':
            return 'kyc';
        case 'ERROR':
            return 'error';
        case 'SUCCESS':
            return 'success';
        default: {
            if (!tradeFinalStatuses['exchange'].includes(tradeStatus)) {
                return 'sending';
            }

            return undefined;
        }
    }
};

export const TradingDetailExchange = () => {
    const accounts = useSelector(selectAccounts);
    const { account, trade, info } = useTradingDetailContext<TradingExchangeType>();
    const dispatch = useDispatch();

    const tradeStatus = trade?.data?.status || 'CONFIRMING';
    const previousTradeStatus = usePrevious(tradeStatus);
    const tradeStatusStep = getTradeStatusStep(tradeStatus);

    const network = trade?.data.send && cryptoIdToNetwork(trade.data.send);
    const explorer = useSelector(state => selectExplorer(state, network?.symbol));

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
            type: EventType.TradingStatus,
            payload: {
                type: 'exchange',
                status: tradeStatusStep,
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

    const sendAccount = accounts.find(account => account.key === trade.sendAccountKey);
    const receiveAccount = accounts.find(account => account.key === trade.receiveAccountKey);

    return (
        <Wrapper>
            <Column gap={spacings.lg}>
                <Card>
                    {trade.data.receiveTxHash && (
                        <InfoItem label={<Translation id="TR_TXID" />}>
                            <TxAddress
                                txAddress={trade.data.receiveTxHash}
                                explorerUrl={getExplorerUrl(explorer, 'tx')}
                                explorerUrlQueryString={explorer?.queryString}
                            />
                        </InfoItem>
                    )}
                    {tradeStatusStep === 'success' && (
                        <TradingDetailExchangePaymentSuccessful account={account} />
                    )}
                    {tradeStatusStep === 'kyc' && (
                        <TradingDetailExchangePaymentKYC
                            account={account}
                            provider={provider}
                            supportUrl={supportUrl}
                        />
                    )}
                    {tradeStatusStep === 'error' && (
                        <TradingDetailExchangePaymentFailed
                            account={account}
                            transactionId={trade.key}
                            supportUrl={supportUrl}
                        />
                    )}
                    {tradeStatusStep === 'converting' && (
                        <TradingDetailExchangePaymentConverting supportUrl={supportUrl} />
                    )}
                    {tradeStatusStep === 'sending' && (
                        <TradingDetailExchangePaymentSending supportUrl={supportUrl} />
                    )}
                </Card>
                <TradingDetailFeedback
                    status={tradeStatus}
                    type={trade.tradeType}
                    provider={provider?.name}
                    id={trade.data.id}
                    quoteAmounts={quoteAmounts}
                />
            </Column>
            <Card>
                <TradingSelectedOfferInfo
                    account={sendAccount}
                    selectedAccount={receiveAccount}
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
