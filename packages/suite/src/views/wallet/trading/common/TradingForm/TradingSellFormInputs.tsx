import { useCallback, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkModuleRepositoryDep } from '@suite-common/networks';
import {
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingSellFormProps,
    type TradingSellType,
    isCountrySubdivisionRequired,
    selectTradingSellQuotes,
    selectTradingSellSupportedCryptoIds,
    selectTradingSendAccount,
} from '@suite-common/trading';
import { type TokenAddress } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { Column, Row } from '@trezor/components';
import { useCurrentRef } from '@trezor/react-utils';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import { useSelectedTradingAsset } from 'src/hooks/wallet/trading/form/common/useSelectedTradingAsset';
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
    const { networkModuleRepository } = useServices(selectNetworkModuleRepositoryDep);

    const {
        type,
        feeInfo,
        composedLevels,
        form: { helpers },
        shouldSendInSats,
        changeFeeLevel,
        showReserveBanner,
    } = context;
    const asset = useSelectedTradingAsset(type);
    const account = useSelector(state => selectTradingSendAccount(state, type));

    const { control } = useFormContext<TradingSellFormProps>();

    const [outputs, sendCryptoSelect, amountInCrypto, countrySelect] = useWatch({
        control,
        name: ['outputs', 'sendCryptoSelect', 'amountInCrypto', 'countrySelect'],
    });
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

    const supportedNetworks = networkModuleRepository.getSupportedNetworks();
    const sellSupportedCryptoIds = useSelector(state =>
        selectTradingSellSupportedCryptoIds(state, supportedNetworks),
    );

    const countryRequiresSubdivision = isCountrySubdivisionRequired(countrySelect?.value);

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
                        inputPlaceholder="TR_SELECT_TOKEN"
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
                        {amountInCrypto && asset && (
                            <Row justifyContent="space-between" alignItems="center" gap={8}>
                                <TradingFractionButtons />
                                <TradingBalance
                                    balance={outputAmount}
                                    displaySymbol={sendCryptoSelect?.id}
                                    symbol={asset.symbol}
                                    tokenAddress={tokenAddress}
                                    showOnlyAmount
                                    amountInCrypto={amountInCrypto}
                                    decimals={sendAssetDecimals}
                                />
                            </Row>
                        )}
                    </Column>
                    {showReserveBanner && asset && (
                        <TradingNetworkReserveBanner
                            symbol={asset.symbol}
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
                        country={countrySelect}
                    />
                )}
                {!!quotes.length && account && (
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
