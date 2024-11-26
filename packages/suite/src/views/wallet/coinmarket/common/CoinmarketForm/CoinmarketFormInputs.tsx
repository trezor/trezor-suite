import { spacings } from '@trezor/theme';
import { Row, Column, Card, ElevationContext } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils/src/firmwareUtils';
import { TokenAddress } from '@suite-common/wallet-types';
import { formatAmount } from '@suite-common/wallet-utils';

import { Fees } from 'src/components/wallet/Fees/Fees';
import {
    FORM_CRYPTO_CURRENCY_SELECT,
    FORM_CRYPTO_INPUT,
    FORM_FIAT_INPUT,
    FORM_OUTPUT_AMOUNT,
    FORM_OUTPUT_FIAT,
    FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    FORM_SEND_CRYPTO_CURRENCY_SELECT,
} from 'src/constants/wallet/coinmarket/form';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import {
    CoinmarketBuyFormProps,
    CoinmarketExchangeFormProps,
    CoinmarketSellFormProps,
} from 'src/types/coinmarket/coinmarketForm';
import { CoinmarketFormInputCryptoSelect } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputCryptoSelect';
import { CoinmarketFormInputAccount } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputAccount';
import { CoinmarketFormInputCountry } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputCountry';
import { CoinmarketFormInputPaymentMethod } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputPaymentMethod';
import { CoinmarketFormSwitcherExchangeRates } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormSwitcherExchangeRates';
import { CoinmarketFormInputFiatCrypto } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputFiatCrypto/CoinmarketFormInputFiatCrypto';
import { CoinmarketFractionButtons } from 'src/views/wallet/coinmarket/common/CoinmarketFractionButtons';
import { CoinmarketBalance } from 'src/views/wallet/coinmarket/common/CoinmarketBalance';
import { getCoinmarketNetworkDecimals } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import {
    isCoinmarketExchangeContext,
    isCoinmarketSellContext,
} from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';

export const CoinmarketFormInputs = () => {
    const context = useCoinmarketFormContext();

    if (isCoinmarketSellContext(context)) {
        const {
            control,
            feeInfo,
            account,
            composedLevels,
            formState: { errors },
            form: { helpers },
            shouldSendInSats,
            register,
            setValue,
            getValues,
            changeFeeLevel,
        } = context;
        const { outputs, sendCryptoSelect, amountInCrypto } = getValues();
        const output = outputs[0];
        const currencySelect = output.currency;
        const tokenAddress = (output.token ?? undefined) as TokenAddress | undefined;
        const outputAmount =
            shouldSendInSats && output.amount
                ? formatAmount(output.amount, getCoinmarketNetworkDecimals({ sendCryptoSelect }))
                : output.amount;

        return (
            <>
                <CoinmarketFormInputAccount<CoinmarketSellFormProps>
                    accountSelectName={FORM_SEND_CRYPTO_CURRENCY_SELECT}
                    label="TR_COINMARKET_YOU_SELL"
                    methods={{ ...context }}
                />
                <Column alignItems="stretch" gap={spacings.xs}>
                    <CoinmarketFormInputFiatCrypto<CoinmarketSellFormProps>
                        cryptoInputName={FORM_OUTPUT_AMOUNT}
                        fiatInputName={FORM_OUTPUT_FIAT}
                        cryptoSelectName={FORM_SEND_CRYPTO_CURRENCY_SELECT}
                        currencySelectLabel={currencySelect.label}
                        cryptoCurrencyLabel={sendCryptoSelect?.value}
                        methods={{ ...context }}
                    />
                    {amountInCrypto && (
                        <Row justifyContent="space-between" alignItems="flex-start">
                            <CoinmarketFractionButtons
                                disabled={helpers.isBalanceZero}
                                onFractionClick={helpers.setRatioAmount}
                                onAllClick={helpers.setAllAmount}
                            />
                            <CoinmarketBalance
                                balance={outputAmount}
                                cryptoSymbolLabel={sendCryptoSelect?.value}
                                symbol={account.symbol}
                                tokenAddress={tokenAddress as TokenAddress}
                                showOnlyAmount
                                amountInCrypto={amountInCrypto}
                                sendCryptoSelect={sendCryptoSelect}
                            />
                        </Row>
                    )}
                </Column>
                <Card margin={{ vertical: spacings.sm }}>
                    <ElevationContext baseElevation={0}>
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
                    </ElevationContext>
                </Card>
                <CoinmarketFormInputPaymentMethod label="TR_COINMARKET_RECEIVE_METHOD" />
                <CoinmarketFormInputCountry label="TR_COINMARKET_COUNTRY" />
            </>
        );
    }

    if (isCoinmarketExchangeContext(context)) {
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
            shouldSendInSats,
        } = context;
        const { rateType, sendCryptoSelect, outputs, amountInCrypto } = getValues();
        const output = outputs[0];
        const currencySelect = output.currency;
        const tokenAddress = (output.token ?? undefined) as TokenAddress | undefined;
        const supportedCryptoCurrencies = exchangeInfo?.buySymbols;
        const outputAmount =
            shouldSendInSats && output.amount
                ? formatAmount(output.amount, getCoinmarketNetworkDecimals({ sendCryptoSelect }))
                : output.amount;

        return (
            <>
                <CoinmarketFormInputAccount<CoinmarketExchangeFormProps>
                    accountSelectName={FORM_SEND_CRYPTO_CURRENCY_SELECT}
                    label="TR_FROM"
                    methods={{ ...context }}
                />
                <Column alignItems="stretch" gap={spacings.xs}>
                    <CoinmarketFormInputFiatCrypto<CoinmarketExchangeFormProps>
                        cryptoInputName={FORM_OUTPUT_AMOUNT}
                        fiatInputName={FORM_OUTPUT_FIAT}
                        cryptoSelectName={FORM_SEND_CRYPTO_CURRENCY_SELECT}
                        currencySelectLabel={currencySelect.label}
                        cryptoCurrencyLabel={sendCryptoSelect?.value}
                        methods={{ ...context }}
                    />
                    {amountInCrypto && (
                        <Row justifyContent="space-between" alignItems="flex-start">
                            <CoinmarketFractionButtons
                                disabled={helpers.isBalanceZero}
                                onFractionClick={helpers.setRatioAmount}
                                onAllClick={helpers.setAllAmount}
                            />
                            <CoinmarketBalance
                                balance={outputAmount}
                                cryptoSymbolLabel={sendCryptoSelect?.value}
                                symbol={account.symbol}
                                tokenAddress={tokenAddress}
                                showOnlyAmount
                                amountInCrypto={amountInCrypto}
                                sendCryptoSelect={sendCryptoSelect}
                            />
                        </Row>
                    )}
                </Column>
                <CoinmarketFormInputCryptoSelect<CoinmarketExchangeFormProps>
                    label="TR_TO"
                    cryptoSelectName={FORM_RECEIVE_CRYPTO_CURRENCY_SELECT}
                    supportedCryptoCurrencies={supportedCryptoCurrencies}
                    methods={{ ...context }}
                />
                <Card margin={{ vertical: spacings.sm }}>
                    <ElevationContext baseElevation={0}>
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
                    </ElevationContext>
                </Card>
                <CoinmarketFormSwitcherExchangeRates rateType={rateType} setValue={setValue} />
            </>
        );
    }

    const { buyInfo, device } = context;
    const { currencySelect, cryptoSelect } = context.getValues();
    const supportedCryptoCurrencies = buyInfo?.supportedCryptoCurrencies;

    return (
        <>
            <CoinmarketFormInputCryptoSelect<CoinmarketBuyFormProps>
                label="TR_COINMARKET_YOU_BUY"
                cryptoSelectName={FORM_CRYPTO_CURRENCY_SELECT}
                supportedCryptoCurrencies={supportedCryptoCurrencies}
                methods={{ ...context }}
                isDisabled={hasBitcoinOnlyFirmware(device)}
            />
            <CoinmarketFormInputFiatCrypto<CoinmarketBuyFormProps>
                cryptoInputName={FORM_CRYPTO_INPUT}
                fiatInputName={FORM_FIAT_INPUT}
                cryptoSelectName={FORM_CRYPTO_CURRENCY_SELECT}
                currencySelectLabel={currencySelect.label}
                cryptoCurrencyLabel={cryptoSelect.value}
                methods={{ ...context }}
            />
            <CoinmarketFormInputPaymentMethod label="TR_COINMARKET_PAYMENT_METHOD" />
            <CoinmarketFormInputCountry label="TR_COINMARKET_COUNTRY" />
        </>
    );
};
