import {
    TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_CRYPTO_INPUT,
    TRADING_FORM_FIAT_INPUT,
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingBuyFormProps,
    type TradingExchangeFormProps,
    type TradingSellFormProps,
} from '@suite-common/trading';
import { TokenAddress } from '@suite-common/wallet-types';
import { formatAmount } from '@suite-common/wallet-utils';
import { Column, FractionButton, FractionButtonProps, Row } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils/src/firmwareUtils';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingUseFormActionsReturnProps } from 'src/types/trading/tradingForm';
import {
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { getTradingNetworkDecimals } from 'src/utils/wallet/trading/tradingUtils';
import { TradingBalance } from 'src/views/wallet/trading/common/TradingBalance';
import { TradingFormInputAccount } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputAccount';
import { TradingFormInputCountry } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputCountry';
import { TradingFormInputCryptoSelect } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputCryptoSelect';
import { TradingFormInputFiatCrypto } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputFiatCrypto';
import { TradingFormInputPaymentMethod } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputPaymentMethod';
import { TradingFormSwitcherExchangeRates } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormSwitcherExchangeRates';

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
            formState: { errors, isDirty },
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
                    accountSelectName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                    label="TR_TRADING_YOU_SELL"
                    methods={{ ...context }}
                />
                <Column gap={spacings.xs}>
                    <TradingFormInputFiatCrypto<TradingSellFormProps>
                        cryptoInputName={TRADING_FORM_OUTPUT_AMOUNT}
                        fiatInputName={TRADING_FORM_OUTPUT_FIAT}
                        cryptoSelectName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
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
                <Fees
                    control={control}
                    feeInfo={feeInfo}
                    account={account}
                    composedLevels={composedLevels}
                    errors={errors}
                    isDirty={isDirty}
                    register={register}
                    setValue={setValue}
                    getValues={getValues}
                    changeFeeLevel={changeFeeLevel}
                />
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
            formState: { errors, isDirty },
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
        const supportedCryptoCurrencies = exchangeInfo?.buyCryptoIds;
        const outputAmount =
            shouldSendInSats && output.amount
                ? formatAmount(output.amount, getTradingNetworkDecimals({ sendCryptoSelect }))
                : output.amount;

        return (
            <>
                <TradingFormInputAccount<TradingExchangeFormProps>
                    accountSelectName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                    label="TR_FROM"
                    data-testid="@trading/form/trade-from/select-crypto"
                    methods={{ ...context }}
                />
                <Column gap={spacings.xs}>
                    <TradingFormInputFiatCrypto<TradingExchangeFormProps>
                        cryptoInputName={TRADING_FORM_OUTPUT_AMOUNT}
                        fiatInputName={TRADING_FORM_OUTPUT_FIAT}
                        cryptoSelectName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
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
                    cryptoSelectName={TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT}
                    supportedCryptoCurrencies={supportedCryptoCurrencies}
                    methods={{ ...context }}
                />
                <Fees
                    control={control}
                    feeInfo={feeInfo}
                    account={account}
                    composedLevels={composedLevels}
                    errors={errors}
                    isDirty={isDirty}
                    register={register}
                    setValue={setValue}
                    getValues={getValues}
                    changeFeeLevel={changeFeeLevel}
                />
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
                cryptoSelectName={TRADING_FORM_CRYPTO_CURRENCY_SELECT}
                supportedCryptoCurrencies={supportedCryptoCurrencies}
                methods={{ ...context }}
                isDisabled={hasBitcoinOnlyFirmware(device)}
            />
            <TradingFormInputFiatCrypto<TradingBuyFormProps>
                cryptoInputName={TRADING_FORM_CRYPTO_INPUT}
                fiatInputName={TRADING_FORM_FIAT_INPUT}
                cryptoSelectName={TRADING_FORM_CRYPTO_CURRENCY_SELECT}
                currencySelectLabel={currencySelect.label}
                cryptoCurrencyLabel={cryptoSelect.value}
                methods={{ ...context }}
            />
            <TradingFormInputPaymentMethod label="TR_TRADING_PAYMENT_METHOD" />
            <TradingFormInputCountry label="TR_TRADING_COUNTRY" />
        </>
    );
};
