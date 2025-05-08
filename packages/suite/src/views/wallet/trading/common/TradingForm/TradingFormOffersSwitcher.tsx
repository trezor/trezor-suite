import {
    TRADING_EXCHANGE_FORM,
    TRADING_EXCHANGE_FORM_CEX,
    TRADING_EXCHANGE_FORM_DEX,
    TRADING_EXCHANGE_RATE,
    TRADING_EXCHANGE_RATE_FLOATING,
    type TradingUtilsProvidersProps,
} from '@suite-common/trading';
import { Card, Column, Paragraph, Row, Spinner } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { TradingExchangeFormContextProps } from 'src/types/trading/tradingForm';
import { TradingFormOffersSwitcherItem } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffersSwitcherItem';

interface TradingFormOffersSwitcherProps {
    context: TradingExchangeFormContextProps;
    isFormLoading: boolean;
    isFormInvalid: boolean;
    providers: TradingUtilsProvidersProps | undefined;
}

export const TradingFormOffersSwitcher = ({
    context,
    isFormLoading,
    isFormInvalid,
    providers,
}: TradingFormOffersSwitcherProps) => {
    const { setValue, getValues, dexQuotes, cexQuotes } = context;
    const { exchangeType } = getValues();
    const cexQuote = cexQuotes?.[0];
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
                            <Translation id="TR_TRADING_OFFER_LOOKING" />
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
                    <Translation id="TR_TRADING_OFFER_NO_FOUND" />
                    <br />
                    <Translation id="TR_TRADING_CHANGE_AMOUNT_OR_CURRENCY" />
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
                    <TradingFormOffersSwitcherItem
                        selectedExchangeType={exchangeType}
                        isSelectable={!hasSingleOption}
                        onSelect={() => setValue(TRADING_EXCHANGE_FORM, TRADING_EXCHANGE_FORM_CEX)}
                        providers={providers}
                        quote={cexQuote}
                    />
                ) : (
                    <Paragraph
                        typographyStyle="label"
                        variant="tertiary"
                        align="center"
                        margin={{ vertical: spacings.md }}
                    >
                        <Translation id="TR_TRADING_NO_CEX_PROVIDER_FOUND" />
                    </Paragraph>
                )}
                {dexQuote ? (
                    <TradingFormOffersSwitcherItem
                        selectedExchangeType={exchangeType}
                        isSelectable={!hasSingleOption}
                        onSelect={() => {
                            setValue(TRADING_EXCHANGE_FORM, TRADING_EXCHANGE_FORM_DEX);
                            setValue(TRADING_EXCHANGE_RATE, TRADING_EXCHANGE_RATE_FLOATING);
                        }}
                        providers={providers}
                        quote={dexQuote}
                    />
                ) : (
                    <Paragraph
                        typographyStyle="label"
                        variant="tertiary"
                        align="center"
                        margin={{ vertical: spacings.md }}
                    >
                        <Translation id="TR_TRADING_NO_DEX_PROVIDER_FOUND" />
                    </Paragraph>
                )}
            </Column>
        </Card>
    );
};
