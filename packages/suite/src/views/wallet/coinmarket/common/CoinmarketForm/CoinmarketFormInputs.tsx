import { spacingsPx } from '@trezor/theme';
import { Fees } from 'src/components/wallet/Fees/Fees';
import {
    FORM_CRYPTO_CURRENCY_SELECT,
    FORM_CRYPTO_INPUT,
    FORM_EXCHANGE_DEX,
    FORM_FIAT_INPUT,
    FORM_OUTPUT_AMOUNT,
    FORM_OUTPUT_FIAT,
    FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    FORM_SEND_CRYPTO_CURRENCY_SELECT,
} from 'src/constants/wallet/coinmarket/form';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import {
    isCoinmarketExchangeOffers,
    isCoinmarketSellOffers,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import {
    CoinmarketBuyFormProps,
    CoinmarketExchangeFormProps,
    CoinmarketSellFormProps,
} from 'src/types/coinmarket/coinmarketForm';
import { CoinmarketFormInput } from 'src/views/wallet/coinmarket';
import { CoinmarketFractionButtons } from 'src/views/wallet/coinmarket/common';
import { CoinmarketFormInputCryptoSelect } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputCryptoSelect';
import { CoinmarketFormInputAccount } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputAccount';
import CoinmarketFormInputCountry from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputCountry';
import CoinmarketFormInputPaymentMethod from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputPaymentMethod';
import styled from 'styled-components';
import { CoinmarketFormSwitcherExchangeRates } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormSwitcherExchangeRates';
import { CoinmarketFormInputFiatCrypto } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputFiatCrypto/CoinmarketFormInputFiatCrypto';

const CoinmarketFeesWrapper = styled.div`
    margin-bottom: ${spacingsPx.md};
`;

const CoinmarketFractionButtonsWrapper = styled(CoinmarketFractionButtons)`
    margin-bottom: ${spacingsPx.xl};
`;

export const CoinmarketFormInputs = () => {
    const context = useCoinmarketFormContext();

    if (isCoinmarketSellOffers(context)) {
        const {
            control,
            feeInfo,
            account,
            composedLevels,
            formState: { errors },
            form: { helpers },
            register,
            setValue,
            getValues,
            changeFeeLevel,
        } = context;
        const { amountInCrypto, sendCryptoSelect } = getValues();
        const currencySelect = getValues().outputs[0].currency;

        return (
            <>
                <CoinmarketFormInput>
                    <CoinmarketFormInputAccount<CoinmarketSellFormProps>
                        accountSelectName={FORM_SEND_CRYPTO_CURRENCY_SELECT}
                        label="TR_COINMARKET_YOU_SELL"
                        methods={{ ...context }}
                    />
                </CoinmarketFormInput>
                <CoinmarketFormInput>
                    <CoinmarketFormInputFiatCrypto<CoinmarketSellFormProps>
                        cryptoInputName={FORM_OUTPUT_AMOUNT}
                        fiatInputName={FORM_OUTPUT_FIAT}
                        cryptoSelectName={FORM_SEND_CRYPTO_CURRENCY_SELECT}
                        currencySelectLabel={currencySelect.label}
                        cryptoCurrencyLabel={sendCryptoSelect?.value}
                        methods={{ ...context }}
                    />
                </CoinmarketFormInput>
                {amountInCrypto && (
                    <CoinmarketFractionButtonsWrapper
                        disabled={helpers.isBalanceZero}
                        onFractionClick={helpers.setRatioAmount}
                        onAllClick={helpers.setAllAmount}
                    />
                )}
                <CoinmarketFeesWrapper>
                    <Fees
                        control={control}
                        feeInfo={feeInfo}
                        account={account}
                        composedLevels={composedLevels}
                        errors={errors}
                        register={register}
                        setValue={setValue}
                        getValues={getValues}
                        changeFeeLevel={changeFeeLevel}
                    />
                </CoinmarketFeesWrapper>
                <CoinmarketFormInput>
                    <CoinmarketFormInputPaymentMethod label="TR_COINMARKET_RECEIVE_METHOD" />
                </CoinmarketFormInput>
                <CoinmarketFormInput>
                    <CoinmarketFormInputCountry label="TR_COINMARKET_COUNTRY" />
                </CoinmarketFormInput>
            </>
        );
    }

    if (isCoinmarketExchangeOffers(context)) {
        const {
            control,
            feeInfo,
            account,
            composedLevels,
            formState: { errors },
            form: { helpers },
            exchangeInfo,
            register,
            setValue,
            getValues,
            changeFeeLevel,
        } = context;
        const { amountInCrypto, rateType, sendCryptoSelect, exchangeType } = getValues();
        const currencySelect = getValues().outputs[0].currency;
        const supportedCryptoCurrencies = exchangeInfo?.buySymbols;

        return (
            <div>
                <CoinmarketFormInput>
                    <CoinmarketFormInputAccount<CoinmarketExchangeFormProps>
                        accountSelectName={FORM_SEND_CRYPTO_CURRENCY_SELECT}
                        label="TR_FROM"
                        methods={{ ...context }}
                    />
                </CoinmarketFormInput>
                <CoinmarketFormInput>
                    <CoinmarketFormInputFiatCrypto<CoinmarketExchangeFormProps>
                        cryptoInputName={FORM_OUTPUT_AMOUNT}
                        fiatInputName={FORM_OUTPUT_FIAT}
                        cryptoSelectName={FORM_SEND_CRYPTO_CURRENCY_SELECT}
                        currencySelectLabel={currencySelect.label}
                        cryptoCurrencyLabel={sendCryptoSelect?.value}
                        methods={{ ...context }}
                    />
                </CoinmarketFormInput>
                {amountInCrypto && (
                    <CoinmarketFractionButtonsWrapper
                        disabled={helpers.isBalanceZero}
                        onFractionClick={helpers.setRatioAmount}
                        onAllClick={helpers.setAllAmount}
                    />
                )}
                <CoinmarketFormInput>
                    <CoinmarketFormInputCryptoSelect<CoinmarketExchangeFormProps>
                        label="TR_TO"
                        cryptoSelectName={FORM_RECEIVE_CRYPTO_CURRENCY_SELECT}
                        supportedCryptoCurrencies={supportedCryptoCurrencies}
                        methods={{ ...context }}
                    />
                </CoinmarketFormInput>
                <CoinmarketFeesWrapper>
                    <Fees
                        control={control}
                        feeInfo={feeInfo}
                        account={account}
                        composedLevels={composedLevels}
                        errors={errors}
                        register={register}
                        setValue={setValue}
                        getValues={getValues}
                        changeFeeLevel={changeFeeLevel}
                    />
                </CoinmarketFeesWrapper>
                {exchangeType !== FORM_EXCHANGE_DEX && (
                    <CoinmarketFormSwitcherExchangeRates rateType={rateType} setValue={setValue} />
                )}
            </div>
        );
    }

    const { buyInfo } = context;
    const { currencySelect, cryptoSelect } = context.getValues();
    const supportedCryptoCurrencies = buyInfo?.supportedCryptoCurrencies;

    return (
        <>
            <CoinmarketFormInput>
                <CoinmarketFormInputCryptoSelect<CoinmarketBuyFormProps>
                    label="TR_COINMARKET_YOU_BUY"
                    cryptoSelectName={FORM_CRYPTO_CURRENCY_SELECT}
                    supportedCryptoCurrencies={supportedCryptoCurrencies}
                    methods={{ ...context }}
                />
            </CoinmarketFormInput>
            <CoinmarketFormInput>
                <CoinmarketFormInputFiatCrypto<CoinmarketBuyFormProps>
                    cryptoInputName={FORM_CRYPTO_INPUT}
                    fiatInputName={FORM_FIAT_INPUT}
                    cryptoSelectName={FORM_CRYPTO_CURRENCY_SELECT}
                    currencySelectLabel={currencySelect.label}
                    cryptoCurrencyLabel={cryptoSelect.value}
                    methods={{ ...context }}
                />
            </CoinmarketFormInput>
            <CoinmarketFormInput>
                <CoinmarketFormInputPaymentMethod label="TR_COINMARKET_PAYMENT_METHOD" />
            </CoinmarketFormInput>
            <CoinmarketFormInput>
                <CoinmarketFormInputCountry label="TR_COINMARKET_COUNTRY" />
            </CoinmarketFormInput>
        </>
    );
};
