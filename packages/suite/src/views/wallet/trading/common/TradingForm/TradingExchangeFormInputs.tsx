import { useCallback, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { events } from '@suite/analytics';
import {
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_PROVIDER_SELECT,
    TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingExchangeFormProps,
    type TradingExchangeType,
    selectTradingExchangeBuyCryptoIds,
    selectTradingExchangeSellCryptoIds,
    selectTradingLoadingAndTimestamp,
    tradingActions,
} from '@suite-common/trading';
import { type TokenAddress } from '@suite-common/wallet-types';
import { convertAmountSubunitsToUnits } from '@suite-common/wallet-utils';
import { Column, FractionButton, Row } from '@trezor/components';
import { useCurrentRef } from '@trezor/react-utils';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useAnalytics } from 'src/support/useAnalytics';
import { TradingBalance } from 'src/views/wallet/trading/common/TradingBalance';
import { TradingFormInputFiatCrypto } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputFiatCrypto';

import { TradingFormCard } from './TradingFormCard';
import { TradingFormFees } from './TradingFormFees';
import { TradingReceiveAddress } from '../TradingSelectedOffer/TradingReceiveAddress/TradingReceiveAddress';
import { TradingSelectedOfferProvider } from '../TradingSelectedOffer/TradingSelectedOfferProvider';
import { AssetPickerInputBalance } from './TradingFormInput/TradingFormInputAssetPicker';
import {
    TradingFormInputBuyAsset,
    type TradingFormInputBuyAssetProps,
} from './TradingFormInput/TradingFormInputBuyAsset/TradingFormInputBuyAsset';
import {
    TradingFormInputSellAsset,
    type TradingFormInputSellAssetProps,
} from './TradingFormInput/TradingFormInputSellAsset/TradingFormInputSellAsset';
import { TradingFormSection } from './TradingFormSection';
import { TradingNetworkReserveBanner } from './TradingNetworkReserveBanner';
import { generateFractionButtons } from './tradingFormInputsUtils';

export const TradingExchangeFormInputs = () => {
    const context = useTradingFormContext<TradingExchangeType>();
    const analytics = useAnalytics();

    const { isLoading } = useSelector(selectTradingLoadingAndTimestamp);

    const {
        feeInfo,
        account,
        composedLevels,
        form: { helpers },
        changeFeeLevel,
        shouldSendInSats,
        showReserveBanner,
        resetSelectedOffer,
        setAmountLimits,
    } = context;
    const { getValues, setValue } = useFormContext<TradingExchangeFormProps>();
    const {
        [TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT]: sendCryptoSelect,
        [TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT]: receiveCryptoSelect,
        outputs,
        amountInCrypto,
    } = getValues();

    const output = outputs[0];
    const currencySelect = output.currency;
    const tokenAddress = (output.token ?? undefined) as TokenAddress | undefined;

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
        shouldSendInSats && output.amount
            ? convertAmountSubunitsToUnits(output.amount, sendAssetDecimals)
            : output.amount;

    const dispatch = useDispatch();
    // `useTradingExchangeForm` has some re-rendering issues, use refs to avoid them
    const setAmountLimitsRef = useCurrentRef(setAmountLimits);
    const setValueRef = useCurrentRef(setValue);
    const resetSelectedOfferRef = useCurrentRef(resetSelectedOffer);

    const onCryptoCurrencyChangeRef = useCurrentRef(helpers.onCryptoCurrencyChange);
    const handleSellAssetSelect = useCallback<TradingFormInputSellAssetProps['onAssetSelect']>(
        async asset => {
            await onCryptoCurrencyChangeRef.current(asset);

            resetSelectedOfferRef.current();
            setValueRef.current(TRADING_FORM_PROVIDER_SELECT, undefined, { shouldDirty: true });
        },
        [onCryptoCurrencyChangeRef, resetSelectedOfferRef, setValueRef],
    );

    const handleReceiveAssetSelect = useCallback<TradingFormInputBuyAssetProps['onAssetSelect']>(
        asset => {
            setValueRef.current(TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT, asset, {
                shouldDirty: true,
            });
            setAmountLimitsRef.current(undefined);
            dispatch(tradingActions.setModalCryptoCurrency(asset.id));
            resetSelectedOfferRef.current();
            setValueRef.current(TRADING_FORM_PROVIDER_SELECT, undefined, { shouldDirty: true });
        },
        [dispatch, setAmountLimitsRef, setValueRef, resetSelectedOfferRef],
    );

    const exchangeBuySupportedCryptoIds = useSelector(selectTradingExchangeBuyCryptoIds);
    const exchangeSellSupportedCryptoIds = useSelector(selectTradingExchangeSellCryptoIds);

    return (
        <TradingFormCard>
            <TradingFormSection>
                <TradingFormInputSellAsset
                    inputName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                    inputLabel="TR_FROM"
                    inputBottomText={
                        <AssetPickerInputBalance
                            name={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                            showOnlyAmount
                        />
                    }
                    includedCryptoIds={exchangeSellSupportedCryptoIds}
                    excludedCryptoId={receiveCryptoSelect?.id}
                    onAssetSelect={handleSellAssetSelect}
                />
                <Column gap={8}>
                    <TradingFormInputFiatCrypto
                        cryptoInputName={TRADING_FORM_OUTPUT_AMOUNT}
                        fiatInputName={TRADING_FORM_OUTPUT_FIAT}
                        cryptoSelectName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                        currencySelectLabel={currencySelect.label}
                        cryptoCurrencyLabel={sendCryptoSelect?.id}
                    />
                    {amountInCrypto && (
                        <Row justifyContent="space-between" alignItems="flex-start">
                            <Row gap={8} data-testid="@trading/form/fraction-buttons">
                                {generateFractionButtons(helpers).map(button => {
                                    const { percentValue, ...buttonProps } = button;

                                    return (
                                        <FractionButton
                                            key={buttonProps.id}
                                            {...buttonProps}
                                            onClick={() => {
                                                analytics.report({
                                                    type: events.appFormPercentButtonsEvent.name,
                                                    payload: {
                                                        type: 'swap',
                                                        value: percentValue,
                                                    },
                                                });
                                                button.onClick();
                                                context.resetSelectedOffer();
                                            }}
                                        />
                                    );
                                })}
                            </Row>
                            <TradingBalance
                                balance={outputAmount}
                                displaySymbol={sendCryptoSelect?.displaySymbol}
                                symbol={account.symbol}
                                tokenAddress={tokenAddress}
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

                <TradingFormInputBuyAsset
                    inputPlaceholder="TR_SELECT_TOKEN"
                    inputLabel="TR_TO"
                    inputName={TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT}
                    includedCryptoIds={exchangeBuySupportedCryptoIds}
                    excludedCryptoId={sendCryptoSelect?.id}
                    onAssetSelect={handleReceiveAssetSelect}
                />
            </TradingFormSection>

            {receiveCryptoSelect && !isLoading && <TradingReceiveAddress />}
            <TradingFormFees
                feeInfo={feeInfo}
                account={account}
                composedLevels={composedLevels}
                changeFeeLevel={changeFeeLevel}
            />
            <TradingSelectedOfferProvider />
        </TradingFormCard>
    );
};
