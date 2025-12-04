import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

import { ExperimentId } from '@suite-common/message-system';
import {
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    TradingExchangeFormProps,
    TradingExchangeType,
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
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { getTradingNetworkDecimals } from 'src/utils/wallet/trading/tradingUtils';
import { TradingBalance } from 'src/views/wallet/trading/common/TradingBalance';
import { TradingFormInputAccount } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputAccount';
import { TradingFormInputFiatCrypto } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputFiatCrypto';
import { TradingFormSwitcherExchangeRates } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormSwitcherExchangeRates';

import { TradingFormFeesDisclamer } from './TradingFormFeeDisclamer';
import { TradingNetworkReserveBanner } from './TradingNetworkReserveBanner';
import { generateFractionButtons } from './tradingFormInputsUtils';
import { TradingReceiveAddress } from '../TradingSelectedOffer/TradingReceiveAddress/TradingReceiveAddress';
import {
    TradingFormInputAssetPicker,
    TradingFormInputAssetPickerProps,
} from './TradingFormInput/TradingFormInputAssetPicker/TradingFormInputAssetPicker';

export const TradingExchangeFormInputs = () => {
    const context = useTradingFormContext<TradingExchangeType>();

    const { isLoading } = useSelector(selectTradingLoadingAndTimestamp);

    const {
        feeInfo,
        account,
        composedLevels,
        form: { helpers },
        exchangeInfo,
        changeFeeLevel,
        shouldSendInSats,
        showReserveBanner,
        resetSelectedOffer,
        setAmountLimits,
    } = context;
    const { getValues, setValue } = useFormContext<TradingExchangeFormProps>();
    const { rateType, sendCryptoSelect, receiveCryptoSelect, outputs, amountInCrypto } =
        getValues();

    const output = outputs[0];
    const currencySelect = output.currency;
    const tokenAddress = (output.token ?? undefined) as TokenAddress | undefined;
    const outputAmount =
        shouldSendInSats && output.amount
            ? convertAmountSubunitsToUnits(
                  output.amount,
                  getTradingNetworkDecimals({ sendCryptoSelect }),
              )
            : output.amount;

    const dispatch = useDispatch();
    // `useTradingExchangeForm` has some re-rendering issues, use refs to avoid them
    const setAmountLimitsRef = useCurrentRef(setAmountLimits);
    const setValueRef = useCurrentRef(setValue);
    const resetSelectedOfferRef = useCurrentRef(resetSelectedOffer);

    const handleReceiveAssetSelect = useCallback<TradingFormInputAssetPickerProps['onAssetSelect']>(
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

    return (
        <Card paddingType="none">
            <Column gap={spacings.lg} padding={spacings.lg}>
                <TradingFormInputAccount
                    accountSelectName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                    label="TR_FROM"
                    data-testid="@trading/form/trade-from/select-crypto"
                />
                <Column gap={spacings.xs}>
                    <TradingFormInputFiatCrypto
                        cryptoInputName={TRADING_FORM_OUTPUT_AMOUNT}
                        fiatInputName={TRADING_FORM_OUTPUT_FIAT}
                        cryptoSelectName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                        currencySelectLabel={currencySelect.label}
                        cryptoCurrencyLabel={sendCryptoSelect?.value}
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
                                                displaySymbol={sendCryptoSelect?.value}
                                                symbol={account.symbol}
                                                tokenAddress={tokenAddress}
                                                showOnlyAmount
                                                amountInCrypto={amountInCrypto}
                                                sendCryptoSelect={sendCryptoSelect}
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

                <TradingFormInputAssetPicker
                    inputPlaceholder="TR_SELECT_TOKEN"
                    inputLabel="TR_TO"
                    inputName={TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT}
                    enabledCryptoIds={exchangeInfo?.buyCryptoIds}
                    onAssetSelect={handleReceiveAssetSelect}
                    dataTestId="@trading/form/select-crypto"
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
            <Divider margin={0} />

            <Column gap={spacings.lg} padding={{ vertical: spacings.lg, horizontal: spacings.lg }}>
                <TradingFormSwitcherExchangeRates rateType={rateType} setValue={setValue} />
                <TradingFormFeesDisclamer />
            </Column>
        </Card>
    );
};
