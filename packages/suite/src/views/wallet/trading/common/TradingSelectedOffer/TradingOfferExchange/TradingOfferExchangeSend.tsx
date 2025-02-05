import { useEffect } from 'react';

import type { TradingExchangeType } from '@suite-common/trading';
import { Button, Column, Divider, InfoItem, Spinner, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { AccountLabeling, Address, Translation } from 'src/components/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingWatchTrade } from 'src/hooks/wallet/trading/useTradingWatchTrade';
import { useTradingNavigation } from 'src/hooks/wallet/useTradingNavigation';

export const TradingOfferExchangeSend = () => {
    const { device, account, callInProgress, selectedQuote, exchangeInfo, sendTransaction, trade } =
        useTradingFormContext<TradingExchangeType>();
    useTradingWatchTrade({
        account,
        trade,
    });
    const { navigateToExchangeDetail } = useTradingNavigation(account);

    const exchangeTrade = trade?.data || selectedQuote;

    useEffect(() => {
        if (exchangeTrade?.status === 'ERROR') {
            navigateToExchangeDetail();
        }
    }, [exchangeTrade, navigateToExchangeDetail]);

    if (!exchangeTrade || !exchangeTrade.exchange) return null;

    const { exchange, sendAddress, status } = exchangeTrade;
    if (!exchange) return null;
    const providerName =
        exchangeInfo?.providerInfos[exchange]?.companyName || exchangeTrade.exchange;

    return (
        <>
            {(status === 'CONFIRM' || status === 'SENDING') && sendAddress ? (
                <Column gap={spacings.lg} flex="1">
                    <InfoItem label={<Translation id="TR_EXCHANGE_SEND_FROM" />}>
                        <AccountLabeling account={account} />
                    </InfoItem>
                    <InfoItem
                        label={<Translation id="TR_EXCHANGE_SEND_TO" values={{ providerName }} />}
                    >
                        <Address value={sendAddress} />
                    </InfoItem>
                    <Column margin={{ top: 'auto' }}>
                        <Divider margin={{ top: spacings.xs, bottom: spacings.lg }} />
                        <Button
                            data-testid="@trading/offer/exchange/confirm-on-trezor-and-send"
                            isLoading={callInProgress}
                            isDisabled={!device?.connected}
                            onClick={sendTransaction}
                        >
                            <Translation id="TR_EXCHANGE_CONFIRM_ON_TREZOR_SEND" />
                        </Button>
                    </Column>
                </Column>
            ) : (
                <Column
                    alignItems="center"
                    justifyContent="center"
                    margin={{ horizontal: spacings.lg, vertical: spacings.xxxxl }}
                >
                    <Spinner margin={{ bottom: spacings.xl }} />
                    <Text>
                        <Translation
                            id="TR_SELL_DETAIL_WAITING_FOR_SEND_CRYPTO"
                            values={{ providerName }}
                        />
                    </Text>
                    <Text variant="tertiary">
                        <Translation
                            id="TR_SELL_DETAIL_WAITING_FOR_SEND_CRYPTO_INFO"
                            values={{ providerName }}
                        />
                    </Text>
                </Column>
            )}
        </>
    );
};
