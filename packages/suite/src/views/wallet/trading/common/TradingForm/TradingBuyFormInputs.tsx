import { useCallback } from 'react';

import { useDevice } from '@suite/device';
import { useServices } from '@suite-common/dependency-injection';
import { selectGetSupportedNetworksDep } from '@suite-common/networks';
import { useDispatch } from '@suite-common/redux-utils';
import {
    TRADING_FORM_COUNTRY_SELECT,
    TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_CRYPTO_INPUT,
    TRADING_FORM_FIAT_INPUT,
    TRADING_FORM_INPUT_AMOUNT_FIELDS,
    type TradingBuyType,
    isCountrySubdivisionRequired,
    selectTradingBuyQuotes,
    selectTradingBuySupportedCryptoIds,
    tradingActions,
} from '@suite-common/trading';
import { type TokenAddress } from '@suite-common/wallet-types';
import { Column, Row } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils/src/firmwareUtils';
import { useCurrentRef } from '@trezor/react-utils';

import { useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingBalance } from 'src/views/wallet/trading/common/TradingBalance';
import { TradingFormInputCountry } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputCountry/TradingFormInputCountry';
import { TradingFormInputFiatCrypto } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputFiatCrypto';
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
    const { getSupportedNetworks } = useServices(selectGetSupportedNetworksDep);

    const { device } = useDevice();
    const { setAmountLimits, getValues, setValue, clearErrors } = context;
    const {
        [TRADING_FORM_CRYPTO_CURRENCY_SELECT]: cryptoSelect,
        [TRADING_FORM_CRYPTO_INPUT]: cryptoInput,
        [TRADING_FORM_COUNTRY_SELECT]: countrySelect,
        amountInCrypto,
        currencySelect,
    } = getValues();

    const dispatch = useDispatch();

    // `useTradingBuyForm` has many re-rendering issues, use refs to avoid them
    const setAmountLimitsRef = useCurrentRef(setAmountLimits);
    const setValueRef = useCurrentRef(setValue);
    const clearErrorsRef = useCurrentRef(clearErrors);

    const handleCryptoSelect = useCallback<TradingFormInputBuyAssetProps['onAssetSelect']>(
        asset => {
            setValueRef.current(TRADING_FORM_CRYPTO_INPUT, '', { shouldDirty: true });
            setValueRef.current(TRADING_FORM_FIAT_INPUT, '', { shouldDirty: true });
            setValueRef.current(TRADING_FORM_CRYPTO_CURRENCY_SELECT, asset, { shouldDirty: true });
            clearErrorsRef.current(TRADING_FORM_INPUT_AMOUNT_FIELDS);
            setAmountLimitsRef.current(undefined);
            dispatch(tradingActions.setModalCryptoCurrency(asset.id));
        },
        [dispatch, setAmountLimitsRef, setValueRef, clearErrorsRef],
    );

    const supportedNetworks = getSupportedNetworks();
    const buySupportedCryptoIds = useSelector(state =>
        selectTradingBuySupportedCryptoIds(state, supportedNetworks),
    );

    const countryRequiresSubdivision = isCountrySubdivisionRequired(countrySelect?.value);

    return (
        <Column gap={16}>
            <TradingFormCard>
                <TradingFormSection>
                    <TradingFormInputBuyAsset
                        inputLabel="TR_TRADING_YOU_BUY"
                        inputName={TRADING_FORM_CRYPTO_CURRENCY_SELECT}
                        inputDisabled={hasBitcoinOnlyFirmware(device)}
                        onAssetSelect={handleCryptoSelect}
                        includedCryptoIds={buySupportedCryptoIds}
                    />
                    <Column gap={8}>
                        <TradingFormInputFiatCrypto
                            cryptoInputName={TRADING_FORM_CRYPTO_INPUT}
                            fiatInputName={TRADING_FORM_FIAT_INPUT}
                            cryptoSelectName={TRADING_FORM_CRYPTO_CURRENCY_SELECT}
                            currencySelectLabel={currencySelect.value.toUpperCase()}
                            cryptoCurrencyLabel={cryptoSelect.id}
                        />

                        {amountInCrypto && (
                            <Row justifyContent="end">
                                <TradingBalance
                                    balance={cryptoInput}
                                    displaySymbol={cryptoSelect.displaySymbol}
                                    symbol={cryptoSelect.networkSymbol}
                                    tokenAddress={
                                        (cryptoSelect.contractAddress as TokenAddress) ?? undefined
                                    }
                                    showOnlyAmount
                                    amountInCrypto={amountInCrypto}
                                />
                            </Row>
                        )}
                    </Column>
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
