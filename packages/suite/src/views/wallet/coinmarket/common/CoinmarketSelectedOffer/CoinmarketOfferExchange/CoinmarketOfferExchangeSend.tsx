import { useEffect } from 'react';

import { Button, Column, Divider, InfoItem, Spinner, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { useCoinmarketWatchTrade } from 'src/hooks/wallet/coinmarket/useCoinmarketWatchTrade';
import { CoinmarketTradeExchangeType } from 'src/types/coinmarket/coinmarket';
import { AccountLabeling, Translation } from 'src/components/suite';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';

export const CoinmarketOfferExchangeSend = () => {
    const { account, callInProgress, selectedQuote, exchangeInfo, sendTransaction, trade } =
        useCoinmarketFormContext<CoinmarketTradeExchangeType>();
    useCoinmarketWatchTrade({
        account,
        trade,
    });
    const { navigateToExchangeDetail } = useCoinmarketNavigation(account);

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
                        {sendAddress}
                    </InfoItem>
                    <Column margin={{ top: 'auto' }}>
                        <Divider margin={{ top: spacings.xs, bottom: spacings.lg }} />
                        <Button
                            data-testid="@coinmarket/offer/exchange/confirm-on-trezor-and-send"
                            isLoading={callInProgress}
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
