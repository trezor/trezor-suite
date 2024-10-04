import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';
import { CoinmarketFormInputPaymentMethod } from '../CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputPaymentMethod';
import { CoinmarketFormInputCountry } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputCountry';
import {
    isCoinmarketBuyOffers,
    isCoinmarketExchangeOffers,
    useCoinmarketOffersContext,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import {
    CoinmarketBuyFormProps,
    CoinmarketSellFormProps,
} from 'src/types/coinmarket/coinmarketForm';
import {
    FORM_CRYPTO_CURRENCY_SELECT,
    FORM_CRYPTO_INPUT,
    FORM_FIAT_INPUT,
    FORM_OUTPUT_AMOUNT,
    FORM_OUTPUT_FIAT,
    FORM_SEND_CRYPTO_CURRENCY_SELECT,
} from 'src/constants/wallet/coinmarket/form';
import { CoinmarketFormInputFiatCrypto } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputFiatCrypto/CoinmarketFormInputFiatCrypto';
import { CoinmarketOffersExchangeFiltersPanel } from './CoinmarketOffersExchangeFiltersPanel';
import { Row } from '@trezor/components';

const InputWrapper = styled.div`
    width: 254px;
    max-width: 100%;
    padding: ${spacingsPx.xxs} ${spacingsPx.md} ${spacingsPx.xxs} 0;
`;

export const CoinmarketHeaderFilter = () => {
    const context = useCoinmarketOffersContext();

    if (isCoinmarketExchangeOffers(context)) {
        return (
            <Row data-testid="@coinmarket/filter" flexWrap="wrap">
                <CoinmarketOffersExchangeFiltersPanel />
            </Row>
        );
    }

    return (
        <Row data-testid="@coinmarket/filter" flexWrap="wrap" alignItems="flex-start">
            {isCoinmarketBuyOffers(context) ? (
                <InputWrapper>
                    <CoinmarketFormInputFiatCrypto<CoinmarketBuyFormProps>
                        showLabel={false}
                        cryptoInputName={FORM_CRYPTO_INPUT}
                        fiatInputName={FORM_FIAT_INPUT}
                        methods={{ ...context }}
                        cryptoSelectName={FORM_CRYPTO_CURRENCY_SELECT}
                    />
                </InputWrapper>
            ) : (
                <InputWrapper>
                    <CoinmarketFormInputFiatCrypto<CoinmarketSellFormProps>
                        showLabel={false}
                        cryptoInputName={FORM_OUTPUT_AMOUNT}
                        fiatInputName={FORM_OUTPUT_FIAT}
                        cryptoSelectName={FORM_SEND_CRYPTO_CURRENCY_SELECT}
                        methods={{ ...context }}
                    />
                </InputWrapper>
            )}
            <InputWrapper>
                <CoinmarketFormInputPaymentMethod />
            </InputWrapper>
            <InputWrapper>
                <CoinmarketFormInputCountry />
            </InputWrapper>
        </Row>
    );
};
