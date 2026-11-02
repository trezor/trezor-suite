import { Translation } from '@suite/intl';
import { isCountrySubdivisionEmpty } from '@suite-common/trading';
import { Card, Paragraph } from '@trezor/components';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    isTradingBuyContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';

type TradingFormOffersWarningsProps = {
    hasQuote: boolean;
};

export const TradingFormOfferWarnings = ({ hasQuote }: TradingFormOffersWarningsProps) => {
    // React Compiler: `watch` keeps one identity for the form's whole life, so a compiled
    // render-time read of it freezes on the first render. Remove once these reads move to
    // `useWatch` or out of render.
    'use no memo';

    const context = useTradingFormContext();
    const {
        isAmountEmpty,
        form: { state },
    } = context;

    const isSubdivisionMissing = (() => {
        if (!isTradingBuyContext(context) && !isTradingSellContext(context)) return false;
        const { countrySelect, countrySubdivisionSelect } = context.watch();

        return isCountrySubdivisionEmpty(countrySelect?.value, countrySubdivisionSelect?.value);
    })();

    return (
        <>
            {!isSubdivisionMissing && !hasQuote && !state.isFormLoading && !state.isFormInvalid && (
                <Card>
                    <Paragraph
                        typographyStyle="body-sm"
                        intent="neutral"
                        priority="secondary"
                        align="center"
                        margin={{ vertical: 8 }}
                        data-testid="trading-offer-found-none"
                    >
                        <Translation
                            id={
                                isAmountEmpty
                                    ? 'TR_BUY_SELL_OFFERS_EMPTY'
                                    : 'TR_TRADING_NO_OFFER_BUY_OR_SELL'
                            }
                        />
                    </Paragraph>
                </Card>
            )}

            {isSubdivisionMissing && (
                <Card>
                    <Paragraph
                        typographyStyle="body-sm"
                        intent="neutral"
                        priority="secondary"
                        align="center"
                        margin={{ vertical: 8 }}
                        data-testid="trading-offer-subdivision-required"
                    >
                        <Translation id="TR_TRADING_SUBDIVISION_REQUIRED_FOR_OFFERS" />
                    </Paragraph>
                </Card>
            )}
        </>
    );
};
