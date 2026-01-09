import { useCallback, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { ExperimentId } from '@suite-common/message-system';
import {
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    TradingExchangeFormProps,
    TradingExchangeType,
    selectTradingExchangeBuyCryptoIds,
    selectTradingExchangeSellCryptoIds,
    selectTradingLoadingAndTimestamp,
    tradingActions,
} from '@suite-common/trading';
import { TokenAddress } from '@suite-common/wallet-types';
import { convertAmountSubunitsToUnits } from '@suite-common/wallet-utils';
import { Card, Column, Divider, FractionButton, Row } from '@trezor/components';
import { useCurrentRef } from '@trezor/react-utils';
import { spacings } from '@trezor/theme';

import { ExperimentWrapper } from 'src/components/suite/Experiment/ExperimentWrapper';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingBalance } from 'src/views/wallet/trading/common/TradingBalance';
import { TradingFormInputFiatCrypto } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputFiatCrypto';

import { TradingFormFeesDisclamer } from './TradingFormFeeDisclamer';
import { AssetPickerInputBalance } from './TradingFormInput/TradingFormInputAssetPicker';
import {
    TradingFormInputBuyAsset,
    TradingFormInputBuyAssetProps,
} from './TradingFormInput/TradingFormInputBuyAsset/TradingFormInputBuyAsset';
import { TradingNetworkReserveBanner } from './TradingNetworkReserveBanner';
import { generateFractionButtons } from './tradingFormInputsUtils';
import { TradingReceiveAddress } from '../TradingSelectedOffer/TradingReceiveAddress/TradingReceiveAddress';
import { TradingSelectedOfferProvider } from '../TradingSelectedOffer/TradingSelectedOfferProvider';
import {
    TradingFormInputSellAsset,
    TradingFormInputSellAssetProps,
} from './TradingFormInput/TradingFormInputSellAsset/TradingFormInputSellAsset';

export const TradingExchangeFormInputs = () => {
    const context = useTradingFormContext<TradingExchangeType>();

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
        },
        [onCryptoCurrencyChangeRef, resetSelectedOfferRef],
    );

    const handleReceiveAssetSelect = useCallback<TradingFormInputBuyAssetProps['onAssetSelect']>(
        asset => {
            setValueRef.current(TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT, asset, {
                shouldDirty: true,
            });
            setAmountLimitsRef.current(undefined);
            dispatch(tradingActions.setModalCryptoCurrency(asset.id));
            resetSelectedOfferRef.current();
        },
        [dispatch, setAmountLimitsRef, setValueRef, resetSelectedOfferRef],
    );

    const exchangeBuySupportedCryptoIds = useSelector(selectTradingExchangeBuyCryptoIds);
    const exchangeSellSupportedCryptoIds = useSelector(selectTradingExchangeSellCryptoIds);

    return (
        <Card paddingType="none">
            <Column gap={spacings.lg} padding={spacings.lg}>
                <TradingFormInputSellAsset
                    inputName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                    inputLabel="TR_FROM"
                    inputBottomText={
                        <AssetPickerInputBalance name={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT} />
                    }
                    includedCryptoIds={exchangeSellSupportedCryptoIds}
                    excludedCryptoId={receiveCryptoSelect?.id}
                    dataTestId="@trading/form/select-crypto-for-sell"
                    onAssetSelect={handleSellAssetSelect}
                />
                <Column gap={spacings.xs}>
                    <TradingFormInputFiatCrypto
                        cryptoInputName={TRADING_FORM_OUTPUT_AMOUNT}
                        fiatInputName={TRADING_FORM_OUTPUT_FIAT}
                        cryptoSelectName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                        currencySelectLabel={currencySelect.label}
                        cryptoCurrencyLabel={sendCryptoSelect?.id}
                    />
                    {amountInCrypto && (
                        <Row justifyContent="space-between" alignItems="flex-start">
                            <Row gap={spacings.xs} data-testid="@trading/form/fraction-buttons">
                                {generateFractionButtons(helpers).map(button => (
                                    <FractionButton
                                        key={button.id}
                                        {...button}
                                        onClick={() => {
                                            button.onClick();
                                            context.resetSelectedOffer();
                                        }}
                                    />
                                ))}
                            </Row>
                            <ExperimentWrapper
                                id={ExperimentId.tradingFiatValues}
                                components={[
                                    {
                                        variant: 'A',
                                        element: <></>,
                                    },
                                    {
                                        variant: 'B',
                                        element: (
                                            <TradingBalance
                                                balance={outputAmount}
                                                displaySymbol={sendCryptoSelect?.displaySymbol}
                                                symbol={account.symbol}
                                                tokenAddress={tokenAddress}
                                                showOnlyAmount
                                                amountInCrypto={amountInCrypto}
                                                decimals={sendAssetDecimals}
                                            />
                                        ),
                                    },
                                ]}
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
                    dataTestId="@trading/form/select-crypto-for-buy"
                />
            </Column>

            {receiveCryptoSelect && !isLoading && <TradingReceiveAddress />}

            <Divider margin={0} />
            <Fees
                feeInfo={feeInfo}
                account={account}
                composedLevels={composedLevels}
                changeFeeLevel={changeFeeLevel}
                padding={{ vertical: spacings.sm, horizontal: spacings.lg }}
            />
            <TradingSelectedOfferProvider />
            <Divider margin={0} />

            <Column gap={spacings.lg} padding={{ vertical: spacings.lg, horizontal: spacings.lg }}>
                <TradingFormFeesDisclamer />
            </Column>
        </Card>
    );
};
