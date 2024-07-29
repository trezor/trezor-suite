import { spacingsPx } from '@trezor/theme';
import { Fees } from 'src/components/wallet/Fees/Fees';
import {
    FORM_CRYPTO_CURRENCY_SELECT,
    FORM_CRYPTO_INPUT,
    FORM_FIAT_INPUT,
    FORM_OUTPUT_AMOUNT,
    FORM_OUTPUT_FIAT,
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
import CoinmarketFormInputAccount from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputAccount';
import CoinmarketFormInputAccountActive from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputAccountActive';
import CoinmarketFormInputCountry from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputCountry';
import CoinmarketFormInputFiatCrypto from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputFiatCrypto/CoinmarketFormInputFiatCrypto';
import CoinmarketFormInputPaymentMethod from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputPaymentMethod';
import styled from 'styled-components';
// import CoinmarketFormExchangeRates from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormExchangeRates';

const CoinmarketFeesWrapper = styled.div`
    margin-bottom: ${spacingsPx.md};
`;

const CoinmarketFractionButtonsWrapper = styled(CoinmarketFractionButtons)`
    margin-bottom: ${spacingsPx.xl};
`;

const CoinmarketFormInputs = () => {
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
        const { amountInCrypto, currencySelect } = getValues();

        return (
            <>
                <CoinmarketFormInput>
                    <CoinmarketFormInputAccountActive label="TR_COINMARKET_YOU_SELL" />
                </CoinmarketFormInput>
                <CoinmarketFormInput>
                    <CoinmarketFormInputFiatCrypto<CoinmarketSellFormProps>
                        cryptoInputName={FORM_CRYPTO_INPUT}
                        fiatInputName={FORM_FIAT_INPUT}
                        currencySelectLabel={currencySelect.label}
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
            register,
            setValue,
            getValues,
            changeFeeLevel,
        } = context;
        const { amountInCrypto } = getValues();
        const currencySelect = getValues().outputs[0].currency;

        return (
            <div>
                <CoinmarketFormInput>
                    <CoinmarketFormInputAccountActive label="TR_FROM" />
                </CoinmarketFormInput>
                <CoinmarketFormInput>
                    <CoinmarketFormInputFiatCrypto<CoinmarketExchangeFormProps>
                        cryptoInputName={FORM_OUTPUT_AMOUNT}
                        fiatInputName={FORM_OUTPUT_FIAT}
                        currencySelectLabel={currencySelect.label}
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
                {/* <CoinmarketFormExchangeRates /> */}
            </div>
        );
    }

    const { buyInfo } = context;
    const { currencySelect } = context.getValues();
    const supportedCryptoCurrencies = buyInfo?.supportedCryptoCurrencies;

    return (
        <>
            <CoinmarketFormInput>
                <CoinmarketFormInputAccount<CoinmarketBuyFormProps>
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
                    currencySelectLabel={currencySelect.label}
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

export default CoinmarketFormInputs;
