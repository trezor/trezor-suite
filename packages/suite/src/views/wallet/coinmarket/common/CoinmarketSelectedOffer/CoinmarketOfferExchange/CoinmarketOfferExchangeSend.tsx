import { Button, Column, Divider, InfoItem } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketTradeExchangeType } from 'src/types/coinmarket/coinmarket';
import { AccountLabeling, Translation } from 'src/components/suite';

export const CoinmarketOfferExchangeSend = () => {
    const { account, callInProgress, selectedQuote, exchangeInfo, sendTransaction } =
        useCoinmarketFormContext<CoinmarketTradeExchangeType>();
    if (!selectedQuote) return null;
    const { exchange, sendAddress } = selectedQuote;
    if (!exchange) return null;
    const providerName =
        exchangeInfo?.providerInfos[exchange]?.companyName || selectedQuote.exchange;

    return (
        <Column gap={spacings.lg} flex="1">
            <InfoItem label={<Translation id="TR_EXCHANGE_SEND_FROM" />}>
                <AccountLabeling account={account} />
            </InfoItem>
            <InfoItem label={<Translation id="TR_EXCHANGE_SEND_TO" values={{ providerName }} />}>
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
    );
};
