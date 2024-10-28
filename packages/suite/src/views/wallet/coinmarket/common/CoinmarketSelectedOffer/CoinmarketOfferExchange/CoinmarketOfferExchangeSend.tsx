import { Button, Column, Divider, Text } from '@trezor/components';
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
        <Column gap={spacings.lg} alignItems="stretch" flex="1">
            <Column alignItems="stretch" gap={spacings.xxs}>
                <Text typographyStyle="label" variant="tertiary">
                    <Translation id="TR_EXCHANGE_SEND_FROM" />
                </Text>
                <Text typographyStyle="hint">
                    <AccountLabeling account={account} />
                </Text>
            </Column>
            <Column alignItems="stretch" gap={spacings.xxs} margin={{ bottom: 'auto' }}>
                <Text typographyStyle="label" variant="tertiary">
                    <Translation id="TR_EXCHANGE_SEND_TO" values={{ providerName }} />
                </Text>
                <Text typographyStyle="hint">{sendAddress}</Text>
            </Column>
            <Column>
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
