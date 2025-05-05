import styled from 'styled-components';

import {
    TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_CRYPTO_INPUT,
    TRADING_FORM_FIAT_INPUT,
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingBuyFormProps,
    type TradingSellFormProps,
} from '@suite-common/trading';
import { Row } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
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
                        cryptoInputName={TRADING_FORM_CRYPTO_INPUT}
                        fiatInputName={TRADING_FORM_FIAT_INPUT}
                        methods={{ ...context }}
                        cryptoSelectName={TRADING_FORM_CRYPTO_CURRENCY_SELECT}
                    />
                </InputWrapper>
            ) : (
                <InputWrapper>
                    <TradingFormInputFiatCrypto<TradingSellFormProps>
                        showLabel={false}
                        cryptoInputName={TRADING_FORM_OUTPUT_AMOUNT}
                        fiatInputName={TRADING_FORM_OUTPUT_FIAT}
                        cryptoSelectName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
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
