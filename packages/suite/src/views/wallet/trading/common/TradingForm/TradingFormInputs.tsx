import { spacings } from '@trezor/theme';
import {
    Row,
    Column,
    Card,
    ElevationContext,
    FractionButton,
    FractionButtonProps,
} from '@trezor/components';
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
} from 'src/constants/wallet/trading/form';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    TradingBuyFormProps,
    TradingExchangeFormProps,
    TradingSellFormProps,
    TradingUseFormActionsReturnProps,
} from 'src/types/trading/tradingForm';
import { TradingFormInputCryptoSelect } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputCryptoSelect';
import { TradingFormInputAccount } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputAccount';
import { TradingFormInputCountry } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputCountry';
import { TradingFormInputPaymentMethod } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputPaymentMethod';
import { TradingFormSwitcherExchangeRates } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormSwitcherExchangeRates';
import { TradingFormInputFiatCrypto } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputFiatCrypto';
import { TradingBalance } from 'src/views/wallet/trading/common/TradingBalance';
import { getTradingNetworkDecimals } from 'src/utils/wallet/trading/tradingUtils';
import {
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { Translation } from 'src/components/suite';

const generateFractionButtons = (
    helpers: TradingUseFormActionsReturnProps,
): FractionButtonProps[] => [
    {
        id: 'TR_FRACTION_BUTTONS_10_PERCENT',
        children: <Translation id="TR_FRACTION_BUTTONS_10_PERCENT" />,
        isDisabled: helpers.isBalanceZero,
        onClick: () => helpers.setRatioAmount(10),
    },
    {
        id: 'TR_FRACTION_BUTTONS_25_PERCENT',
        children: <Translation id="TR_FRACTION_BUTTONS_25_PERCENT" />,
        isDisabled: helpers.isBalanceZero,
        onClick: () => helpers.setRatioAmount(4),
    },
    {
        id: 'TR_FRACTION_BUTTONS_50_PERCENT',
        children: <Translation id="TR_FRACTION_BUTTONS_50_PERCENT" />,
        isDisabled: helpers.isBalanceZero,
        onClick: () => helpers.setRatioAmount(2),
    },
    {
        id: 'TR_FRACTION_BUTTONS_MAX',
        children: <Translation id="TR_FRACTION_BUTTONS_MAX" />,
        onClick: () => helpers.setAllAmount(),
    },
];

export const TradingFormInputs = () => {
    const context = useTradingFormContext();

    if (isTradingSellContext(context)) {
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
                ? formatAmount(output.amount, getTradingNetworkDecimals({ sendCryptoSelect }))
                : output.amount;

        return (
            <>
                <TradingFormInputAccount<TradingSellFormProps>
                    accountSelectName={FORM_SEND_CRYPTO_CURRENCY_SELECT}
                    label="TR_TRADING_YOU_SELL"
                    methods={{ ...context }}
                />
                <Column gap={spacings.xs}>
                    <TradingFormInputFiatCrypto<TradingSellFormProps>
                        cryptoInputName={FORM_OUTPUT_AMOUNT}
                        fiatInputName={FORM_OUTPUT_FIAT}
                        cryptoSelectName={FORM_SEND_CRYPTO_CURRENCY_SELECT}
                        currencySelectLabel={currencySelect.label}
                        cryptoCurrencyLabel={sendCryptoSelect?.value}
                        methods={{ ...context }}
                    />
                    {amountInCrypto && (
                        <Row justifyContent="space-between" alignItems="flex-start">
                            <Row gap={spacings.xs}>
                                {generateFractionButtons(helpers).map(button => (
                                    <FractionButton key={button.id} {...button} />
                                ))}
                            </Row>
                            <TradingBalance
                                balance={outputAmount}
                                displaySymbol={sendCryptoSelect?.value}
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
                <TradingFormInputPaymentMethod label="TR_TRADING_RECEIVE_METHOD" />
                <TradingFormInputCountry label="TR_TRADING_COUNTRY" />
            </>
        );
    }

    if (isTradingExchangeContext(context)) {
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
                ? formatAmount(output.amount, getTradingNetworkDecimals({ sendCryptoSelect }))
                : output.amount;

        return (
            <>
                <TradingFormInputAccount<TradingExchangeFormProps>
                    accountSelectName={FORM_SEND_CRYPTO_CURRENCY_SELECT}
                    label="TR_FROM"
                    methods={{ ...context }}
                />
                <Column gap={spacings.xs}>
                    <TradingFormInputFiatCrypto<TradingExchangeFormProps>
                        cryptoInputName={FORM_OUTPUT_AMOUNT}
                        fiatInputName={FORM_OUTPUT_FIAT}
                        cryptoSelectName={FORM_SEND_CRYPTO_CURRENCY_SELECT}
                        currencySelectLabel={currencySelect.label}
                        cryptoCurrencyLabel={sendCryptoSelect?.value}
                        methods={{ ...context }}
                    />
                    {amountInCrypto && (
                        <Row justifyContent="space-between" alignItems="flex-start">
                            <Row gap={spacings.xs}>
                                {generateFractionButtons(helpers).map(button => (
                                    <FractionButton key={button.id} {...button} />
                                ))}
                            </Row>
                            <TradingBalance
                                balance={outputAmount}
                                displaySymbol={sendCryptoSelect?.value}
                                symbol={account.symbol}
                                tokenAddress={tokenAddress}
                                showOnlyAmount
                                amountInCrypto={amountInCrypto}
                                sendCryptoSelect={sendCryptoSelect}
                            />
                        </Row>
                    )}
                </Column>
                <TradingFormInputCryptoSelect<TradingExchangeFormProps>
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
                <TradingFormSwitcherExchangeRates rateType={rateType} setValue={setValue} />
            </>
        );
    }

    const { buyInfo, device } = context;
    const { currencySelect, cryptoSelect } = context.getValues();
    const supportedCryptoCurrencies = buyInfo?.supportedCryptoCurrencies;

    return (
        <>
            <TradingFormInputCryptoSelect<TradingBuyFormProps>
                label="TR_TRADING_YOU_BUY"
                cryptoSelectName={FORM_CRYPTO_CURRENCY_SELECT}
                supportedCryptoCurrencies={supportedCryptoCurrencies}
                methods={{ ...context }}
                isDisabled={hasBitcoinOnlyFirmware(device)}
            />
            <TradingFormInputFiatCrypto<TradingBuyFormProps>
                cryptoInputName={FORM_CRYPTO_INPUT}
                fiatInputName={FORM_FIAT_INPUT}
                cryptoSelectName={FORM_CRYPTO_CURRENCY_SELECT}
                currencySelectLabel={currencySelect.label}
                cryptoCurrencyLabel={cryptoSelect.value}
                methods={{ ...context }}
            />
            <TradingFormInputPaymentMethod label="TR_TRADING_PAYMENT_METHOD" />
            <TradingFormInputCountry label="TR_TRADING_COUNTRY" />
        </>
    );
};
