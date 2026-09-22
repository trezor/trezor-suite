import { useCallback, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { Translation } from '@suite/intl';
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
import { Column, Row } from '@trezor/components';
import { useCurrentRef } from '@trezor/react-utils';

import { useSelector } from 'src/hooks/suite';
import { useSelectedTradingAsset } from 'src/hooks/wallet/trading/form/common/useSelectedTradingAsset';
import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingBalance } from 'src/views/wallet/trading/common/TradingBalance';
import { TradingFormInputCountry } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputCountry/TradingFormInputCountry';
import { TradingFormInputCurrency } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputCurrency';
import { TradingFormInputCryptoAmount } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputCryptoAmount';
import { TradingFormInputFiat } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputFiat';
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

    const {
        control,
        formState: { errors },
    } = useFormContext<TradingSellFormProps>();

    const [outputs, sendCryptoSelect, countrySelect] = useWatch({
        control,
        name: ['outputs', 'sendCryptoSelect', 'countrySelect'],
    });
    const output = outputs[0];
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

    const onCryptoCurrencyChangeRef = useCurrentRef(helpers.onCryptoCurrencyChange);
    const handleSellAssetSelect = useCallback<TradingFormInputSellAssetProps['onAssetSelect']>(
        async asset => {
            await onCryptoCurrencyChangeRef.current(asset);
        },
        [onCryptoCurrencyChangeRef],
    );
    const sellSupportedCryptoIds = useSelector(selectTradingSellSupportedCryptoIds);

    const countryRequiresSubdivision = isCountrySubdivisionRequired(countrySelect?.value);

    return (
        <Column gap={20}>
            <TradingFormCard>
                <TradingFormSection
                    title={<Translation id="TR_TRADING_YOU_PAY" />}
                    errorMessage={errors.outputs?.[0]?.amount?.message}
                    data-testid="@trading/form/you-pay"
                >
                    <Row gap={12} alignItems="center">
                        <TradingFormInputCryptoAmount
                            cryptoInputName={TRADING_FORM_OUTPUT_AMOUNT}
                            fiatInputName={TRADING_FORM_OUTPUT_FIAT}
                            cryptoSelectName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                        />
                        <TradingFormInputSellAsset
                            inputName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                            inputLabel="TR_TRADING_YOU_SELL"
                            inputPlaceholder="TR_SELECT_TOKEN"
                            includedCryptoIds={sellSupportedCryptoIds}
                            onAssetSelect={handleSellAssetSelect}
                        />
                    </Row>
                    <Row gap={8} justifyContent="space-between" alignItems="center" minHeight={20}>
                        {!!asset && (
                            <TradingBalance
                                balance={output?.amount}
                                symbol={asset.symbol}
                                tokenAddress={tokenAddress}
                                showOnlyAmount
                                isInSats={shouldSendInSats}
                                decimals={sendAssetDecimals}
                            />
                        )}
                        <Row gap={12} alignItems="center">
                            <TradingFractionButtons />
                            <AssetPickerInputBalance
                                name={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                            />
                        </Row>
                    </Row>
                    {showReserveBanner && asset && (
                        <TradingNetworkReserveBanner
                            symbol={asset.symbol}
                            contractAddress={tokenAddress}
                        />
                    )}
                </TradingFormSection>

                <TradingFormSection
                    title={<Translation id="TR_TRADING_YOU_GET" />}
                    errorMessage={errors.outputs?.[0]?.fiat?.message}
                    data-testid="@trading/form/you-get"
                >
                    <Row gap={12} alignItems="center">
                        <TradingFormInputFiat
                            cryptoInputName={TRADING_FORM_OUTPUT_AMOUNT}
                            fiatInputName={TRADING_FORM_OUTPUT_FIAT}
                            cryptoSelectName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                        />
                        <TradingFormInputCurrency />
                    </Row>
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
