import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import {
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingExchangeFormProps,
    type TradingExchangeType,
    selectTradingExchangeBuyCryptoIds,
    selectTradingExchangeSellCryptoIds,
    selectTradingLoadingAndTimestamp,
    selectTradingSendAccount,
} from '@suite-common/trading';
import { type TokenAddress } from '@suite-common/wallet-types';
import { Box, Column, Row, Text } from '@trezor/components';

import { useFetchFees } from 'src/components/wallet/Fees/CollapsibleFees/hooks/useFetchFees';
import { useSelector } from 'src/hooks/suite';
import { useSelectedTradingAsset } from 'src/hooks/wallet/trading/form/common/useSelectedTradingAsset';
import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { TradingBalance } from 'src/views/wallet/trading/common/TradingBalance';
import { TradingFormInputCryptoAmount } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputCryptoAmount';
import { useTradingQuoteAmounts } from 'src/views/wallet/trading/common/hooks/useTradingQuoteAmounts';
import { useTradingSelectedQuote } from 'src/views/wallet/trading/common/hooks/useTradingSelectedQuote';

import { TradingFormCard } from './TradingFormCard';
import { TradingReceiveAddress } from '../TradingSelectedOffer/TradingReceiveAddress/TradingReceiveAddress';
import { TradingSelectedOfferProvider } from '../TradingSelectedOffer/TradingSelectedOfferProvider';
import { AssetPickerInputBalance } from './TradingFormInput/TradingFormInputAssetPicker';
import { TradingFormInputBuyAsset } from './TradingFormInput/TradingFormInputBuyAsset/TradingFormInputBuyAsset';
import { TradingFormInputSellAsset } from './TradingFormInput/TradingFormInputSellAsset/TradingFormInputSellAsset';
import { TradingFormSection } from './TradingFormSection';
import { TradingFractionButtons } from './TradingFractionButtons';
import { TradingNetworkReserveBanner } from './TradingNetworkReserveBanner';
import { TRADING_AMOUNT_PLACEHOLDER } from './tradingFormInputsUtils';
import { useTradingExchangeAssetSelect } from './useTradingExchangeAssetSelect';

export const TradingExchangeFormInputs = () => {
    const context = useTradingFormContext<TradingExchangeType>();

    const { isLoading } = useSelector(selectTradingLoadingAndTimestamp);

    const {
        type,
        form: { helpers, state },
        shouldSendInSats,
        showReserveBanner,
        setAmountLimits,
    } = context;
    const asset = useSelectedTradingAsset(type);
    const { CryptoAmountFormatter } = useFormatters();
    const account = useSelector(state => selectTradingSendAccount(state, type));

    useFetchFees({ networkSymbol: account?.symbol });

    const methods = useFormContext<TradingExchangeFormProps>();
    const {
        control,
        formState: { errors },
    } = methods;

    const [sendCryptoSelect, receiveCryptoSelect, outputs] = useWatch({
        control,
        name: [
            TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
            TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
            'outputs',
        ],
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
    const quoteFromFormValues = useTradingSelectedQuote(type);
    const quoteAmounts = useTradingQuoteAmounts(quoteFromFormValues, type);
    const receiveAmount = state.isLoadingOrInvalid ? undefined : quoteAmounts?.receiveAmount;
    const { isBtcSatsAmountUnit: shouldReceiveInSats } = useBitcoinAmountUnit(
        receiveCryptoSelect?.networkSymbol,
    );

    const { handleSellAssetSelect, handleReceiveAssetSelect } = useTradingExchangeAssetSelect({
        methods,
        onCryptoCurrencyChange: helpers.onCryptoCurrencyChange,
        setAmountLimits,
    });

    const exchangeBuySupportedCryptoIds = useSelector(selectTradingExchangeBuyCryptoIds);
    const exchangeSellSupportedCryptoIds = useSelector(selectTradingExchangeSellCryptoIds);

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
                            inputLabel="TR_FROM"
                            includedCryptoIds={exchangeSellSupportedCryptoIds}
                            inputPlaceholder="TR_SELECT_TOKEN"
                            onAssetSelect={handleSellAssetSelect}
                        />
                    </Row>
                    <Row gap={8} justifyContent="space-between" alignItems="center" minHeight={20}>
                        {!!sendCryptoSelect && asset && (
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
                    {showReserveBanner && !!sendCryptoSelect && asset && (
                        <TradingNetworkReserveBanner
                            symbol={asset.symbol}
                            contractAddress={tokenAddress}
                        />
                    )}
                </TradingFormSection>

                <TradingFormSection
                    title={<Translation id="TR_TRADING_YOU_GET" />}
                    data-testid="@trading/form/you-get"
                >
                    <Row gap={12} justifyContent="space-between" alignItems="center">
                        <Text
                            typographyStyle="headline-md"
                            isDisabled={!receiveAmount}
                            data-testid="@trading/form/receive-amount"
                        >
                            {receiveAmount && receiveCryptoSelect ? (
                                <CryptoAmountFormatter
                                    value={receiveAmount}
                                    symbol={receiveCryptoSelect.networkSymbol}
                                    withSymbol={false}
                                    smallestUnitsOverride={shouldReceiveInSats}
                                />
                            ) : (
                                TRADING_AMOUNT_PLACEHOLDER
                            )}
                        </Text>
                        <TradingFormInputBuyAsset
                            inputPlaceholder="TR_SELECT_TOKEN"
                            inputLabel="TR_TO"
                            inputName={TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT}
                            includedCryptoIds={exchangeBuySupportedCryptoIds}
                            onAssetSelect={handleReceiveAssetSelect}
                        />
                    </Row>
                    <Box minHeight={20}>
                        {!!receiveCryptoSelect && (
                            <TradingBalance
                                balance={receiveAmount}
                                symbol={receiveCryptoSelect.networkSymbol}
                                tokenAddress={
                                    (receiveCryptoSelect.contractAddress as TokenAddress) ??
                                    undefined
                                }
                                showOnlyAmount
                            />
                        )}
                    </Box>
                </TradingFormSection>
            </TradingFormCard>

            {receiveCryptoSelect && (
                <TradingFormCard>
                    {!isLoading && <TradingReceiveAddress />}
                    <TradingSelectedOfferProvider />
                </TradingFormCard>
            )}
        </Column>
    );
};
