import { Control, useWatch } from 'react-hook-form';

import styled from 'styled-components';

import {
    TRADING_FORM_COUNTRY_SELECT,
    TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_CRYPTO_INPUT,
    TRADING_FORM_FIAT_INPUT,
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    TradingTradeBuySellType,
    isCountrySubdivisionRequired,
} from '@suite-common/trading';
import { Row } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingBuySellFormProps } from 'src/types/trading/tradingForm';
import {
    isTradingBuyContext,
    isTradingExchangeContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { TradingFormInputCountry } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputCountry/TradingFormInputCountry';
import { TradingFormInputFiatCrypto } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputFiatCrypto';
import { TradingFormInputPaymentMethod } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputPaymentMethod/TradingFormInputPaymentMethod';
import { TradingOffersExchangeFiltersPanel } from 'src/views/wallet/trading/common/TradingHeader/TradingOffersExchangeFiltersPanel';

import { TradingFormInputCountrySubdivision } from '../TradingForm/TradingFormInput/TradingFormInputCountry/TradingFormInputCountrySubdivision';

const InputWrapper = styled.div`
    width: 200px;
    max-width: 100%;
    padding: ${spacingsPx.xxs} ${spacingsPx.md} ${spacingsPx.xxs} 0;
`;

export const TradingHeaderFilter = () => {
    const context = useTradingFormContext<TradingTradeBuySellType>();

    const selectedCountry = useWatch({
        control: context.control as Control<TradingBuySellFormProps>,
        name: TRADING_FORM_COUNTRY_SELECT,
    });
    const countryRequiresSubdivision = isCountrySubdivisionRequired(selectedCountry?.value);

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
                    <TradingFormInputFiatCrypto
                        showLabel={false}
                        cryptoInputName={TRADING_FORM_CRYPTO_INPUT}
                        fiatInputName={TRADING_FORM_FIAT_INPUT}
                        cryptoSelectName={TRADING_FORM_CRYPTO_CURRENCY_SELECT}
                    />
                </InputWrapper>
            ) : (
                <InputWrapper>
                    <TradingFormInputFiatCrypto
                        showLabel={false}
                        cryptoInputName={TRADING_FORM_OUTPUT_AMOUNT}
                        fiatInputName={TRADING_FORM_OUTPUT_FIAT}
                        cryptoSelectName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                    />
                </InputWrapper>
            )}
            <InputWrapper>
                <TradingFormInputPaymentMethod renderInput label="TR_TRADING_PAYMENT_METHOD" />
            </InputWrapper>
            <InputWrapper>
                <TradingFormInputCountry renderInput label="TR_TRADING_COUNTRY" />
            </InputWrapper>
            {countryRequiresSubdivision && (
                <InputWrapper>
                    <TradingFormInputCountrySubdivision
                        renderInput
                        label="TR_TRADING_COUNTRY_SUBDIVISION"
                        country={selectedCountry}
                    />
                </InputWrapper>
            )}
        </Row>
    );
};
