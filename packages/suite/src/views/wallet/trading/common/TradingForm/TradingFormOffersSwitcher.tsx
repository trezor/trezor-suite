import {
    TRADING_EXCHANGE_FORM,
    TRADING_EXCHANGE_FORM_CEX,
    TRADING_EXCHANGE_FORM_DEX,
    TRADING_EXCHANGE_RATE,
    TRADING_EXCHANGE_RATE_FIXED,
    TRADING_EXCHANGE_RATE_FLOATING,
    TradingType,
    type TradingUtilsProvidersProps,
} from '@suite-common/trading';
import { Card, Column, Paragraph, Row, Spinner } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';
import { useSelector, useTranslation } from 'src/hooks/suite';
import { selectTorState } from 'src/selectors/suite/suiteSelectors';
import { TradingExchangeFormContextProps } from 'src/types/trading/tradingForm';
import { TradingFormOffersSwitcherItem } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffersSwitcherItem';

import { TradingUtilsTorWarning } from '../TradingUtils/TradingUtilsTorWarning';

interface TradingFormOffersSwitcherProps {
    context: TradingExchangeFormContextProps;
    isFormLoading: boolean;
    isFormInvalid: boolean;
    providers: TradingUtilsProvidersProps | undefined;
    amountIsEmpty: boolean;
    tradingType: TradingType;
}

export const TradingFormOffersSwitcher = ({
    context,
    isFormLoading,
    isFormInvalid,
    providers,
    amountIsEmpty,
    tradingType,
}: TradingFormOffersSwitcherProps) => {
    const { isTorEnabled } = useSelector(selectTorState);
    const { setValue, getValues, dexQuotes, cexQuotes, preselectedQuote } = context;
    const { translationString } = useTranslation();
    const { exchangeType, rateType } = getValues();
    const cexQuote = cexQuotes?.[0];
    const dexQuote = dexQuotes?.[0];
    const hasSingleOption = !cexQuote !== !dexQuote;
    const bestQuote = cexQuote ?? dexQuote;

    const noOffersWithTor = isTorEnabled && !bestQuote && !isFormLoading && !isFormInvalid;

    if (!bestQuote || isFormLoading || isFormInvalid) {
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

        if (noOffersWithTor) {
            return <TradingUtilsTorWarning tradingType={tradingType} noOffer={!bestQuote} />;
        }

        return (
            <>
                <Card>
                    <Paragraph
                        typographyStyle="hint"
                        variant="tertiary"
                        align="center"
                        margin={{ vertical: spacings.xs }}
                    >
                        <Translation
                            id={
                                amountIsEmpty
                                    ? 'TR_TRADING_OFFERS_EMPTY'
                                    : 'TR_TRADING_NO_OFFER_SWAP'
                            }
                            values={{
                                offers: translationString(
                                    rateType === TRADING_EXCHANGE_RATE_FIXED
                                        ? 'TR_TRADING_SWAP_FIXED_RATE_OFFER'
                                        : 'TR_TRADING_SWAP_FLOATING_RATE_OFFER',
                                ),
                            }}
                        />
                    </Paragraph>
                </Card>
            </>
        );
    }

    return (
        <>
            <Card paddingType="none">
                <Column
                    margin={{ horizontal: spacings.xxs, vertical: spacings.xxs }}
                    gap={spacings.xxs}
                >
                    {preselectedQuote ? (
                        <TradingFormOffersSwitcherItem
                            selectedExchangeType={preselectedQuote.isDex ? 'DEX' : 'CEX'}
                            isSelectable={!hasSingleOption}
                            onSelect={() => {
                                if (preselectedQuote.isDex) {
                                    setValue(TRADING_EXCHANGE_FORM, TRADING_EXCHANGE_FORM_CEX);
                                } else {
                                    setValue(TRADING_EXCHANGE_FORM, TRADING_EXCHANGE_FORM_DEX);
                                    setValue(TRADING_EXCHANGE_RATE, TRADING_EXCHANGE_RATE_FLOATING);
                                }
                            }}
                            providers={providers}
                            quote={preselectedQuote}
                        />
                    ) : (
                        <>
                            {cexQuote ? (
                                <TradingFormOffersSwitcherItem
                                    selectedExchangeType={exchangeType}
                                    isSelectable={!hasSingleOption}
                                    onSelect={() => {
                                        setValue(TRADING_EXCHANGE_FORM, TRADING_EXCHANGE_FORM_CEX);
                                    }}
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
                                        setValue(
                                            TRADING_EXCHANGE_RATE,
                                            TRADING_EXCHANGE_RATE_FLOATING,
                                        );
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
                        </>
                    )}
                </Column>
            </Card>
            <TradingUtilsTorWarning tradingType={tradingType} noOffer={!bestQuote} />
        </>
    );
};
