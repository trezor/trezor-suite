import { useCallback, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import {
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingSellFormProps,
    type TradingSellType,
    isCountrySubdivisionRequired,
    selectTradingSellQuotes,
    selectTradingSellSupportedCryptoIds,
} from '@suite-common/trading';
import { type TokenAddress } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { Column, Row } from '@trezor/components';
import { useCurrentRef } from '@trezor/react-utils';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingBalance } from 'src/views/wallet/trading/common/TradingBalance';
import { TradingFormInputCountry } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputCountry/TradingFormInputCountry';
import { TradingFormInputFiatCrypto } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputFiatCrypto';
import { TradingFormInputPaymentMethod } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputPaymentMethod/TradingFormInputPaymentMethod';

import { TradingFormCard } from './TradingFormCard';
import { TradingFormFees } from './TradingFormFees';
import { TradingFractionButtons } from './TradingFractionButtons';
import { TradingSelectedOfferProvider } from '../TradingSelectedOffer/TradingSelectedOfferProvider';
import { AssetPickerInputBalance } from './TradingFormInput/TradingFormInputAssetPicker';
import { TradingFormInputCountrySubdivision } from './TradingFormInput/TradingFormInputCountry/TradingFormInputCountrySubdivision';
import {
    TradingFormInputSellAsset,
    type TradingFormInputSellAssetProps,
} from './TradingFormInput/TradingFormInputSellAsset/TradingFormInputSellAsset';
import { TradingFormSection } from './TradingFormSection';
import { TradingNetworkReserveBanner } from './TradingNetworkReserveBanner';

export const TradingSellFormInputs = () => {
    const context = useTradingFormContext<TradingSellType>();
    const quotes = useSelector(selectTradingSellQuotes);
    const sellSupportedCryptoIds = useSelector(selectTradingSellSupportedCryptoIds);

    const {
        feeInfo,
        account,
        composedLevels,
        form: { helpers },
        shouldSendInSats,
        changeFeeLevel,
        showReserveBanner,
        defaultCountry,
    } = context;

    const { getValues } = useFormContext<TradingSellFormProps>();

    const { outputs, sendCryptoSelect, amountInCrypto, countrySelect } = getValues();
    const output = outputs[0];
    const currencySelect = output?.currency;
    const tokenAddress = (output?.token ?? undefined) as TokenAddress | undefined;

    const { getAssetDecimals } = useTradingAssetDecimals();
    const sendAssetDecimals = useMemo(
        () =>
            getAssetDecimals({
                accountKey: sendCryptoSelect?.accountKey,
                cryptoId: sendCryptoSelect?.id,
            }),
        [getAssetDecimals, sendCryptoSelect?.accountKey, sendCryptoSelect?.id],
    );

    const outputAmount =
        shouldSendInSats && output?.amount
            ? subunitsToUnits({
                  value: asAmountSubunit(new BigNumber(output.amount)),
                  decimals: sendAssetDecimals,
              }).toString()
            : output?.amount;

    const onCryptoCurrencyChangeRef = useCurrentRef(helpers.onCryptoCurrencyChange);
    const handleSellAssetSelect = useCallback<TradingFormInputSellAssetProps['onAssetSelect']>(
        async asset => {
            await onCryptoCurrencyChangeRef.current(asset);
        },
        [onCryptoCurrencyChangeRef],
    );

    const selectedCountry = countrySelect ?? defaultCountry;
    const countryRequiresSubdivision = isCountrySubdivisionRequired(selectedCountry?.value);

    return (
        <Column gap={20}>
            <TradingFormCard>
                <TradingFormSection>
                    <TradingFormInputSellAsset
                        inputName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                        inputLabel="TR_TRADING_YOU_SELL"
                        inputBottomText={
                            <AssetPickerInputBalance
                                name={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                            />
                        }
                        includedCryptoIds={sellSupportedCryptoIds}
                        onAssetSelect={handleSellAssetSelect}
                    />
                    <Column gap={8}>
                        <TradingFormInputFiatCrypto
                            cryptoInputName={TRADING_FORM_OUTPUT_AMOUNT}
                            fiatInputName={TRADING_FORM_OUTPUT_FIAT}
                            cryptoSelectName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                            currencySelectLabel={currencySelect?.value.toUpperCase() ?? ''}
                            cryptoCurrencyLabel={sendCryptoSelect?.id}
                        />
                        {amountInCrypto && (
                            <Row justifyContent="space-between" alignItems="center" gap={8}>
                                <TradingFractionButtons />
                                <TradingBalance
                                    balance={outputAmount}
                                    displaySymbol={sendCryptoSelect?.id}
                                    symbol={account.symbol}
                                    tokenAddress={tokenAddress as TokenAddress}
                                    showOnlyAmount
                                    amountInCrypto={amountInCrypto}
                                    decimals={sendAssetDecimals}
                                />
                            </Row>
                        )}
                    </Column>
                    {showReserveBanner && (
                        <TradingNetworkReserveBanner
                            symbol={account.symbol}
                            contractAddress={tokenAddress}
                        />
                    )}
                </TradingFormSection>
            </TradingFormCard>
            <TradingFormCard>
                <TradingFormInputCountry label="TR_TRADING_COUNTRY" />
                {countryRequiresSubdivision && (
                    <TradingFormInputCountrySubdivision
                        label="TR_TRADING_COUNTRY_SUBDIVISION"
                        country={selectedCountry}
                    />
                )}
                {!!quotes.length && (
                    <>
                        <TradingFormFees
                            feeInfo={feeInfo}
                            account={account}
                            composedLevels={composedLevels}
                            changeFeeLevel={changeFeeLevel}
                        />
                        <TradingFormInputPaymentMethod label="TR_TRADING_RECEIVE_METHOD" />
                    </>
                )}

                <TradingSelectedOfferProvider />
            </TradingFormCard>
        </Column>
    );
};
