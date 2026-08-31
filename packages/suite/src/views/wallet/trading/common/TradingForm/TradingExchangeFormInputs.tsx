import { useCallback, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useDispatch } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkModuleRepositoryDep } from '@suite-common/networks';
import {
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_AMOUNT_FIELDS,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_PROVIDER_SELECT,
    TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingExchangeFormProps,
    type TradingExchangeType,
    getDisplayComposedLevels,
    selectTradingExchangeBuyCryptoIds,
    selectTradingExchangeQuotes,
    selectTradingExchangeSelectedQuote,
    selectTradingExchangeSellCryptoIds,
    selectTradingLoadingAndTimestamp,
    selectTradingSendAccount,
    tradingActions,
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
import { TradingFractionButtons } from './TradingFractionButtons';
import { TradingNetworkReserveBanner } from './TradingNetworkReserveBanner';

export const TradingExchangeFormInputs = () => {
    const context = useTradingFormContext<TradingExchangeType>();
    const { networkModuleRepository } = useServices(selectNetworkModuleRepositoryDep);

    const { isLoading } = useSelector(selectTradingLoadingAndTimestamp);
    const quotes = useSelector(selectTradingExchangeQuotes);
    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);

    const {
        type,
        feeInfo,
        composedLevels,
        form: { helpers },
        changeFeeLevel,
        shouldSendInSats,
        showReserveBanner,
        setAmountLimits,
    } = context;
    const asset = useSelectedTradingAsset(type);
    const account = useSelector(state => selectTradingSendAccount(state, type));

    const displayComposedLevels = useMemo(
        () => getDisplayComposedLevels(selectedQuote, composedLevels),
        [selectedQuote, composedLevels],
    );
    const { getValues, setValue, clearErrors } = useFormContext<TradingExchangeFormProps>();
    const {
        [TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT]: sendCryptoSelect,
        [TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT]: receiveCryptoSelect,
        outputs,
        amountInCrypto,
    } = getValues();

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

    const dispatch = useDispatch();
    // `useTradingExchangeForm` has some re-rendering issues, use refs to avoid them
    const setAmountLimitsRef = useCurrentRef(setAmountLimits);
    const setValueRef = useCurrentRef(setValue);
    const clearErrorsRef = useCurrentRef(clearErrors);

    const onCryptoCurrencyChangeRef = useCurrentRef(helpers.onCryptoCurrencyChange);
    const handleSellAssetSelect = useCallback<TradingFormInputSellAssetProps['onAssetSelect']>(
        async asset => {
            await onCryptoCurrencyChangeRef.current(asset);

            setValueRef.current(TRADING_FORM_PROVIDER_SELECT, undefined, { shouldDirty: true });
        },
        [onCryptoCurrencyChangeRef, setValueRef],
    );

    const handleReceiveAssetSelect = useCallback<TradingFormInputBuyAssetProps['onAssetSelect']>(
        asset => {
            setValueRef.current(TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT, asset, {
                shouldDirty: true,
            });
            clearErrorsRef.current(TRADING_FORM_OUTPUT_AMOUNT_FIELDS);
            setAmountLimitsRef.current(undefined);
            dispatch(tradingActions.setModalCryptoCurrency(asset.id));
            setValueRef.current(TRADING_FORM_PROVIDER_SELECT, undefined, { shouldDirty: true });
        },
        [dispatch, setAmountLimitsRef, setValueRef, clearErrorsRef],
    );

    const supportedNetworks = networkModuleRepository.getSupportedNetworks();
    const exchangeBuySupportedCryptoIds = useSelector(state =>
        selectTradingExchangeBuyCryptoIds(state, supportedNetworks),
    );
    const exchangeSellSupportedCryptoIds = useSelector(state =>
        selectTradingExchangeSellCryptoIds(state, supportedNetworks),
    );

    return (
        <Column gap={20}>
            <TradingFormCard>
                <TradingFormSection>
                    <TradingFormInputSellAsset
                        inputName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                        inputLabel="TR_FROM"
                        inputBottomText={
                            <AssetPickerInputBalance
                                name={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                            />
                        }
                        includedCryptoIds={exchangeSellSupportedCryptoIds}
                        excludedCryptoId={receiveCryptoSelect?.id}
                        inputPlaceholder="TR_SELECT_TOKEN"
                        onAssetSelect={handleSellAssetSelect}
                    />
                    <Column gap={8}>
                        <TradingFormInputFiatCrypto
                            cryptoInputName={TRADING_FORM_OUTPUT_AMOUNT}
                            fiatInputName={TRADING_FORM_OUTPUT_FIAT}
                            cryptoSelectName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                            currencySelectLabel={currencySelect?.value.toUpperCase()}
                            cryptoCurrencyLabel={sendCryptoSelect?.id}
                        />
                        {amountInCrypto && asset && (
                            <Row justifyContent="space-between" alignItems="center" gap={8}>
                                <TradingFractionButtons />
                                <TradingBalance
                                    balance={outputAmount}
                                    displaySymbol={sendCryptoSelect?.displaySymbol}
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

                    <TradingFormInputBuyAsset
                        inputPlaceholder="TR_SELECT_TOKEN"
                        inputLabel="TR_TO"
                        inputName={TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT}
                        includedCryptoIds={exchangeBuySupportedCryptoIds}
                        excludedCryptoId={sendCryptoSelect?.id}
                        onAssetSelect={handleReceiveAssetSelect}
                    />
                </TradingFormSection>
            </TradingFormCard>

            {receiveCryptoSelect && (
                <TradingFormCard>
                    {!isLoading && <TradingReceiveAddress />}
                    {!!quotes.length && account && (
                        <TradingFormFees
                            feeInfo={feeInfo}
                            account={account}
                            composedLevels={displayComposedLevels}
                            changeFeeLevel={changeFeeLevel}
                        />
                    )}
                    <TradingSelectedOfferProvider />
                </TradingFormCard>
            )}
        </Column>
    );
};
