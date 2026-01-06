import { useCallback } from 'react';

import { ExperimentId } from '@suite-common/message-system';
import {
    TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_CRYPTO_INPUT,
    TRADING_FORM_FIAT_INPUT,
    TradingBuyType,
    selectTradingLoadingAndTimestamp,
    tradingActions,
} from '@suite-common/trading';
import { TokenAddress } from '@suite-common/wallet-types';
import { Card, Column, Divider, Row } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils/src/firmwareUtils';
import { useCurrentRef } from '@trezor/react-utils';
import { spacings } from '@trezor/theme';

import { ExperimentWrapper } from 'src/components/suite/Experiment/ExperimentWrapper';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingBalance } from 'src/views/wallet/trading/common/TradingBalance';
import { TradingFormInputCountry } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputCountry';
import { TradingFormInputFiatCrypto } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputFiatCrypto';
import { TradingFormInputPaymentMethod } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputPaymentMethod';

import { TradingFormFeesDisclamer } from './TradingFormFeeDisclamer';
import { TradingReceiveAddress } from '../TradingSelectedOffer/TradingReceiveAddress/TradingReceiveAddress';
import { TradingSelectedOfferProvider } from '../TradingSelectedOffer/TradingSelectedOfferProvider';
import {
    TradingFormInputBuyAsset,
    TradingFormInputBuyAssetProps,
} from './TradingFormInput/TradingFormInputBuyAsset/TradingFormInputBuyAsset';

export const TradingBuyFormInputs = () => {
    const context = useTradingFormContext<TradingBuyType>();

    const { isLoading } = useSelector(selectTradingLoadingAndTimestamp);

    const { buyInfo, device, setAmountLimits, getValues, setValue } = context;
    const {
        [TRADING_FORM_CRYPTO_CURRENCY_SELECT]: cryptoSelect,
        [TRADING_FORM_CRYPTO_INPUT]: cryptoInput,
        amountInCrypto,
        currencySelect,
    } = getValues();

    const dispatch = useDispatch();

    // `useTradingBuyForm` has many re-rendering issues, use refs to avoid them
    const setAmountLimitsRef = useCurrentRef(setAmountLimits);
    const setValueRef = useCurrentRef(setValue);

    const handleCryptoSelect = useCallback<TradingFormInputBuyAssetProps['onAssetSelect']>(
        asset => {
            setValueRef.current(TRADING_FORM_CRYPTO_CURRENCY_SELECT, asset, { shouldDirty: true });
            setAmountLimitsRef.current(undefined);
            dispatch(tradingActions.setModalCryptoCurrency(asset.id));
        },
        [dispatch, setAmountLimitsRef, setValueRef],
    );

    return (
        <Column gap={spacings.lg}>
            <Card paddingType="none">
                <Column gap={spacings.lg}>
                    <Column
                        gap={spacings.lg}
                        padding={{
                            vertical: spacings.md,
                            horizontal: spacings.lg,
                            bottom: cryptoSelect.id && !isLoading ? 0 : spacings.md,
                        }}
                    >
                        <Column gap={spacings.xs}>
                            <TradingFormInputFiatCrypto
                                cryptoInputName={TRADING_FORM_CRYPTO_INPUT}
                                fiatInputName={TRADING_FORM_FIAT_INPUT}
                                cryptoSelectName={TRADING_FORM_CRYPTO_CURRENCY_SELECT}
                                currencySelectLabel={currencySelect.label}
                                cryptoCurrencyLabel={cryptoSelect.id}
                            />

                            {amountInCrypto && (
                                <ExperimentWrapper
                                    id={ExperimentId.tradingFiatValues}
                                    components={[
                                        {
                                            variant: 'A',
                                            element: <></>,
                                        },
                                        {
                                            variant: 'B',
                                            element: cryptoSelect.networkSymbol ? (
                                                <Row justifyContent="end">
                                                    <TradingBalance
                                                        balance={cryptoInput}
                                                        displaySymbol={cryptoSelect.displaySymbol}
                                                        symbol={cryptoSelect.networkSymbol}
                                                        tokenAddress={
                                                            (cryptoSelect.contractAddress as TokenAddress) ??
                                                            undefined
                                                        }
                                                        showOnlyAmount
                                                        amountInCrypto={amountInCrypto}
                                                    />
                                                </Row>
                                            ) : (
                                                <></>
                                            ),
                                        },
                                    ]}
                                />
                            )}
                        </Column>

                        <TradingFormInputBuyAsset
                            inputLabel="TR_TRADING_YOU_BUY"
                            inputName={TRADING_FORM_CRYPTO_CURRENCY_SELECT}
                            inputDisabled={hasBitcoinOnlyFirmware(device)}
                            enabledCryptoIds={buyInfo?.supportedCryptoCurrencies}
                            onAssetSelect={handleCryptoSelect}
                            dataTestId="@trading/form/select-crypto"
                        />
                    </Column>

                    {cryptoSelect && !isLoading && <TradingReceiveAddress />}
                </Column>
            </Card>

            <Card paddingType="none">
                <Column gap={spacings.lg}>
                    <Column
                        gap={spacings.lg}
                        padding={{ vertical: spacings.md, horizontal: spacings.lg }}
                    >
                        <TradingFormInputPaymentMethod label="TR_TRADING_PAYMENT_METHOD" />
                        <TradingFormInputCountry label="TR_TRADING_COUNTRY" />
                    </Column>
                </Column>
                <TradingSelectedOfferProvider />
                <Divider margin={0} />
                <Column
                    gap={spacings.lg}
                    padding={{ vertical: spacings.md, horizontal: spacings.lg }}
                >
                    <TradingFormFeesDisclamer />
                </Column>
            </Card>
        </Column>
    );
};
