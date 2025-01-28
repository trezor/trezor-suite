import styled from 'styled-components';

import { Row } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

import {
    FORM_CRYPTO_CURRENCY_SELECT,
    FORM_CRYPTO_INPUT,
    FORM_FIAT_INPUT,
    FORM_OUTPUT_AMOUNT,
    FORM_OUTPUT_FIAT,
    FORM_SEND_CRYPTO_CURRENCY_SELECT,
} from 'src/constants/wallet/trading/form';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingBuyFormProps, TradingSellFormProps } from 'src/types/trading/tradingForm';
import {
    isTradingBuyContext,
    isTradingExchangeContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { TradingFormInputCountry } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputCountry';
import { TradingFormInputFiatCrypto } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputFiatCrypto';
import { TradingFormInputPaymentMethod } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputPaymentMethod';
import { TradingOffersExchangeFiltersPanel } from 'src/views/wallet/trading/common/TradingHeader/TradingOffersExchangeFiltersPanel';

const InputWrapper = styled.div`
    width: 254px;
    max-width: 100%;
    padding: ${spacingsPx.xxs} ${spacingsPx.md} ${spacingsPx.xxs} 0;
`;

export const TradingHeaderFilter = () => {
    const context = useTradingFormContext();

    if (isTradingExchangeContext(context)) {
        return (
            <Row data-testid="@trading/filter" flexWrap="wrap">
                <TradingOffersExchangeFiltersPanel />
            </Row>
        );
    }

    return (
        <Row data-testid="@trading/filter" flexWrap="wrap" alignItems="flex-start">
            {isTradingBuyContext(context) ? (
                <InputWrapper>
                    <TradingFormInputFiatCrypto<TradingBuyFormProps>
                        showLabel={false}
                        cryptoInputName={FORM_CRYPTO_INPUT}
                        fiatInputName={FORM_FIAT_INPUT}
                        methods={{ ...context }}
                        cryptoSelectName={FORM_CRYPTO_CURRENCY_SELECT}
                    />
                </InputWrapper>
            ) : (
                <InputWrapper>
                    <TradingFormInputFiatCrypto<TradingSellFormProps>
                        showLabel={false}
                        cryptoInputName={FORM_OUTPUT_AMOUNT}
                        fiatInputName={FORM_OUTPUT_FIAT}
                        cryptoSelectName={FORM_SEND_CRYPTO_CURRENCY_SELECT}
                        methods={{ ...context }}
                    />
                </InputWrapper>
            )}
            <InputWrapper>
                <TradingFormInputPaymentMethod />
            </InputWrapper>
            <InputWrapper>
                <TradingFormInputCountry />
            </InputWrapper>
        </Row>
    );
};
