import { useCallback } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import {
    TRADING_FORM_AMOUNT_IN_CRYPTO,
    TRADING_FORM_COUNTRY_SELECT,
    TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_CRYPTO_INPUT,
    TRADING_FORM_FIAT_INPUT,
    TRADING_FORM_INPUT_AMOUNT_FIELDS,
    type TradingBuyType,
    getNetworkDecimalsWithFallback,
    isCountrySubdivisionRequired,
    selectTradingBuyQuotes,
    selectTradingBuySupportedCryptoIds,
    tradingActions,
} from '@suite-common/trading';
import { type TokenAddress } from '@suite-common/wallet-types';
import { Column, Row } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils/src/firmwareUtils';
import { useCurrentRef } from '@trezor/react-utils';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { TradingFormInputCountry } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputCountry/TradingFormInputCountry';
import { TradingFormInputCurrency } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputCurrency';
import { TradingFormInputBaseCurrencyAmount } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputBaseCurrencyAmount';
import { TradingFormInputCryptoAmount } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputCryptoAmount';
import { TradingFormInputFiat } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputFiat';
import { TradingFormInputPaymentMethod } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputPaymentMethod/TradingFormInputPaymentMethod';

import { TradingFormCard } from './TradingFormCard';
import { TradingFormSection } from './TradingFormSection';
import { TradingSelectedOfferProvider } from '../TradingSelectedOffer/TradingSelectedOfferProvider';
import {
    TradingFormInputBuyAsset,
    type TradingFormInputBuyAssetProps,
} from './TradingFormInput/TradingFormInputBuyAsset/TradingFormInputBuyAsset';
import { TradingFormInputCountrySubdivision } from './TradingFormInput/TradingFormInputCountry/TradingFormInputCountrySubdivision';
import { TradingReceiveAddress } from '../TradingSelectedOffer/TradingReceiveAddress/TradingReceiveAddress';

export const TradingBuyFormInputs = () => {
    const context = useTradingFormContext<TradingBuyType>();
    const quotes = useSelector(selectTradingBuyQuotes);
    const { dispatch } = useServices(injectDispatch);

    const { device } = useDevice();
    const {
        setAmountLimits,
        getValues,
        setValue,
        clearErrors,
        formState: { errors },
    } = context;
    const {
        [TRADING_FORM_CRYPTO_CURRENCY_SELECT]: cryptoSelect,
        [TRADING_FORM_COUNTRY_SELECT]: countrySelect,
    } = getValues();

    const { isBtcSatsAmountUnit: shouldBuyInSats } = useBitcoinAmountUnit(
        cryptoSelect?.networkSymbol,
    );

    // `useTradingBuyForm` has many re-rendering issues, use refs to avoid them
    const setAmountLimitsRef = useCurrentRef(setAmountLimits);
    const getValuesRef = useCurrentRef(getValues);
    const setValueRef = useCurrentRef(setValue);
    const clearErrorsRef = useCurrentRef(clearErrors);

    const handleCryptoSelect = useCallback<TradingFormInputBuyAssetProps['onAssetSelect']>(
        asset => {
            const isAmountInCrypto = getValuesRef.current(TRADING_FORM_AMOUNT_IN_CRYPTO);
            const cryptoAmount = new BigNumber(
                getValuesRef.current(TRADING_FORM_CRYPTO_INPUT) ?? '',
            );

            setValueRef.current(
                isAmountInCrypto ? TRADING_FORM_FIAT_INPUT : TRADING_FORM_CRYPTO_INPUT,
                '',
                { shouldDirty: true },
            );

            if (isAmountInCrypto && !cryptoAmount.isNaN()) {
                setValueRef.current(
                    TRADING_FORM_CRYPTO_INPUT,
                    cryptoAmount
                        .decimalPlaces(
                            getNetworkDecimalsWithFallback(asset.networkSymbol),
                            BigNumber.ROUND_DOWN,
                        )
                        .toFixed(),
                    { shouldDirty: true },
                );
            }

            setValueRef.current(TRADING_FORM_CRYPTO_CURRENCY_SELECT, asset, { shouldDirty: true });
            clearErrorsRef.current(TRADING_FORM_INPUT_AMOUNT_FIELDS);
            setAmountLimitsRef.current(undefined);
            dispatch(tradingActions.setModalCryptoCurrency(asset.id));
        },
        [dispatch, setAmountLimitsRef, getValuesRef, setValueRef, clearErrorsRef],
    );
    const buySupportedCryptoIds = useSelector(selectTradingBuySupportedCryptoIds);

    const countryRequiresSubdivision = isCountrySubdivisionRequired(countrySelect?.value);

    return (
        <Column gap={16}>
            <TradingFormCard>
                <TradingFormSection
                    title={<Translation id="TR_TRADING_YOU_PAY" />}
                    errorMessage={errors.fiatInput?.message}
                    data-testid="@trading/form/you-pay"
                >
                    <Row gap={12} alignItems="center">
                        <TradingFormInputFiat
                            cryptoInputName={TRADING_FORM_CRYPTO_INPUT}
                            fiatInputName={TRADING_FORM_FIAT_INPUT}
                            cryptoSelectName={TRADING_FORM_CRYPTO_CURRENCY_SELECT}
                        />
                        <TradingFormInputCurrency />
                    </Row>
                </TradingFormSection>

                <TradingFormSection
                    title={<Translation id="TR_TRADING_YOU_GET" />}
                    errorMessage={errors.cryptoInput?.message}
                    data-testid="@trading/form/you-get"
                >
                    <Row gap={12} alignItems="center">
                        <TradingFormInputCryptoAmount
                            cryptoInputName={TRADING_FORM_CRYPTO_INPUT}
                            fiatInputName={TRADING_FORM_FIAT_INPUT}
                            cryptoSelectName={TRADING_FORM_CRYPTO_CURRENCY_SELECT}
                        />
                        <TradingFormInputBuyAsset
                            inputLabel="TR_TRADING_YOU_BUY"
                            inputName={TRADING_FORM_CRYPTO_CURRENCY_SELECT}
                            inputDisabled={hasBitcoinOnlyFirmware(device)}
                            onAssetSelect={handleCryptoSelect}
                            includedCryptoIds={buySupportedCryptoIds}
                        />
                    </Row>
                    <Row minHeight={20}>
                        {!!cryptoSelect && (
                            <TradingFormInputBaseCurrencyAmount
                                cryptoInputName={TRADING_FORM_CRYPTO_INPUT}
                                fiatInputName={TRADING_FORM_FIAT_INPUT}
                                symbol={cryptoSelect.networkSymbol}
                                tokenAddress={
                                    (cryptoSelect.contractAddress as TokenAddress) ?? undefined
                                }
                                isInSats={shouldBuyInSats}
                            />
                        )}
                    </Row>
                </TradingFormSection>
            </TradingFormCard>

            <TradingFormCard>
                {cryptoSelect && <TradingReceiveAddress />}
                <TradingFormInputCountry label="TR_TRADING_COUNTRY" />
                {countrySelect && countryRequiresSubdivision && (
                    <TradingFormInputCountrySubdivision
                        label="TR_TRADING_COUNTRY_SUBDIVISION"
                        country={countrySelect}
                    />
                )}
                {!!quotes.length && (
                    <TradingFormInputPaymentMethod label="TR_TRADING_PAYMENT_METHOD" />
                )}
                <TradingSelectedOfferProvider />
            </TradingFormCard>
        </Column>
    );
};
