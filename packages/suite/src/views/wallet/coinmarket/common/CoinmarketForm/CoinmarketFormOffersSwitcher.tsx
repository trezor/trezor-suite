import { ExchangeTrade } from 'invity-api';

import { spacings } from '@trezor/theme';
import { Row, Card, Column, Spinner, Paragraph } from '@trezor/components';

import { Translation } from 'src/components/suite';
import {
    CoinmarketTradeDetailType,
    CoinmarketUtilsProvidersProps,
} from 'src/types/coinmarket/coinmarket';
import { CoinmarketExchangeFormContextProps } from 'src/types/coinmarket/coinmarketForm';
import {
    FORM_EXCHANGE_CEX,
    FORM_EXCHANGE_DEX,
    FORM_EXCHANGE_TYPE,
    FORM_RATE_FLOATING,
    FORM_RATE_TYPE,
} from 'src/constants/wallet/coinmarket/form';
import { CoinmarketFormOffersSwitcherItem } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormOffersSwitcherItem';

interface CoinmarketFormOffersSwitcherProps {
    context: CoinmarketExchangeFormContextProps;
    isFormLoading: boolean;
    isFormInvalid: boolean;
    providers: CoinmarketUtilsProvidersProps | undefined;
    quotes: ExchangeTrade[] | undefined;
    bestRatedQuote: CoinmarketTradeDetailType | undefined;
}

export const CoinmarketFormOffersSwitcher = ({
    context,
    isFormLoading,
    isFormInvalid,
    providers,
    quotes,
    bestRatedQuote,
}: CoinmarketFormOffersSwitcherProps) => {
    const { setValue, getValues, dexQuotes } = context;
    const { exchangeType } = getValues();
    const cexQuote = quotes?.[0];
    const dexQuote = dexQuotes?.[0];
    const hasSingleOption = !cexQuote !== !dexQuote;
    const bestQuote = cexQuote ?? dexQuote;

    if (!bestQuote || isFormLoading) {
        if (isFormLoading && !isFormInvalid) {
            return (
                <Card>
                    <Row
                        justifyContent="center"
                        margin={{ vertical: spacings.xs }}
                        gap={spacings.sm}
                    >
                        <Spinner size={32} isGrey={false} />
                        <Paragraph typographyStyle="hint" variant="tertiary">
                            <Translation id="TR_COINMARKET_OFFER_LOOKING" />
                        </Paragraph>
                    </Row>
                </Card>
            );
        }

        return (
            <Card>
                <Paragraph
                    typographyStyle="hint"
                    variant="tertiary"
                    align="center"
                    margin={{ vertical: spacings.xs }}
                >
                    <Translation id="TR_COINMARKET_OFFER_NO_FOUND" />
                    <br />
                    <Translation id="TR_COINMARKET_CHANGE_AMOUNT_OR_CURRENCY" />
                </Paragraph>
            </Card>
        );
    }

    return (
        <Card paddingType="none">
            <Column
                margin={{ horizontal: spacings.xxs, vertical: spacings.xxs }}
                gap={spacings.xxs}
            >
                {cexQuote ? (
                    <CoinmarketFormOffersSwitcherItem
                        selectedExchangeType={exchangeType}
                        isSelectable={!hasSingleOption}
                        onSelect={() => setValue(FORM_EXCHANGE_TYPE, FORM_EXCHANGE_CEX)}
                        providers={providers}
                        quote={cexQuote}
                        isBestRate={bestRatedQuote?.orderId === cexQuote?.orderId}
                    />
                ) : (
                    <Paragraph
                        typographyStyle="label"
                        variant="tertiary"
                        align="center"
                        margin={{ vertical: spacings.md }}
                    >
                        <Translation id="TR_COINMARKET_NO_CEX_PROVIDER_FOUND" />
                    </Paragraph>
                )}
                {dexQuote ? (
                    <CoinmarketFormOffersSwitcherItem
                        selectedExchangeType={exchangeType}
                        isSelectable={!hasSingleOption}
                        onSelect={() => {
                            setValue(FORM_EXCHANGE_TYPE, FORM_EXCHANGE_DEX);
                            setValue(FORM_RATE_TYPE, FORM_RATE_FLOATING);
                        }}
                        providers={providers}
                        quote={dexQuote}
                        isBestRate={bestRatedQuote?.orderId === dexQuote?.orderId}
                    />
                ) : (
                    <Paragraph
                        typographyStyle="label"
                        variant="tertiary"
                        align="center"
                        margin={{ vertical: spacings.md }}
                    >
                        <Translation id="TR_COINMARKET_NO_DEX_PROVIDER_FOUND" />
                    </Paragraph>
                )}
            </Column>
        </Card>
    );
};
