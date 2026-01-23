import { useCallback, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import {
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingSellFormProps,
    TradingSellType,
    selectTradingSellSupportedCryptoIds,
} from '@suite-common/trading';
import { TokenAddress } from '@suite-common/wallet-types';
import { convertAmountSubunitsToUnits } from '@suite-common/wallet-utils';
import { Card, Column, Divider, FractionButton, Row } from '@trezor/components';
import { useCurrentRef } from '@trezor/react-utils';
import { spacings } from '@trezor/theme';

import { Fees } from 'src/components/wallet/Fees/Fees';
import { useSelector } from 'src/hooks/suite';
import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingBalance } from 'src/views/wallet/trading/common/TradingBalance';
import { TradingFormInputCountry } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputCountry';
import { TradingFormInputFiatCrypto } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputFiatCrypto';
import { TradingFormInputPaymentMethod } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputPaymentMethod';

import { TradingFormFeesDisclamer } from './TradingFormFeeDisclamer';
import { AssetPickerInputBalance } from './TradingFormInput/TradingFormInputAssetPicker';
import { TradingNetworkReserveBanner } from './TradingNetworkReserveBanner';
import { generateFractionButtons } from './tradingFormInputsUtils';
import { TradingSelectedOfferProvider } from '../TradingSelectedOffer/TradingSelectedOfferProvider';
import {
    TradingFormInputSellAsset,
    TradingFormInputSellAssetProps,
} from './TradingFormInput/TradingFormInputSellAsset/TradingFormInputSellAsset';

export const TradingSellFormInputs = () => {
    const context = useTradingFormContext<TradingSellType>();

    const {
        feeInfo,
        account,
        composedLevels,
        form: { helpers },
        shouldSendInSats,
        changeFeeLevel,
        showReserveBanner,
    } = context;
    const { getValues } = useFormContext<TradingSellFormProps>();
    const { outputs, sendCryptoSelect, amountInCrypto } = getValues();
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

    const onCryptoCurrencyChangeRef = useCurrentRef(helpers.onCryptoCurrencyChange);
    const handleSellAssetSelect = useCallback<TradingFormInputSellAssetProps['onAssetSelect']>(
        async asset => {
            await onCryptoCurrencyChangeRef.current(asset);
        },
        [onCryptoCurrencyChangeRef],
    );

    const sellSupportedCryptoIds = useSelector(selectTradingSellSupportedCryptoIds);

    return (
        <Card paddingType="none">
            <Column gap={spacings.lg} padding={{ vertical: spacings.md, horizontal: spacings.lg }}>
                <TradingFormInputSellAsset
                    inputName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                    inputLabel="TR_TRADING_YOU_SELL"
                    inputBottomText={
                        <AssetPickerInputBalance name={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT} />
                    }
                    includedCryptoIds={sellSupportedCryptoIds}
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
                                    <FractionButton key={button.id} {...button} />
                                ))}
                            </Row>
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
            </Column>
            <Divider margin={0} />
            <Fees
                feeInfo={feeInfo}
                account={account}
                composedLevels={composedLevels}
                changeFeeLevel={changeFeeLevel}
                isHeaderRowLayout
            />
            <Divider margin={0} />
            <Column gap={spacings.lg} padding={{ vertical: spacings.md, horizontal: spacings.lg }}>
                <TradingFormInputPaymentMethod label="TR_TRADING_RECEIVE_METHOD" />
                <TradingFormInputCountry label="TR_TRADING_COUNTRY" />
            </Column>
            <TradingSelectedOfferProvider />
            <Divider margin={0} />
            <Column gap={spacings.lg} padding={{ vertical: spacings.md, horizontal: spacings.lg }}>
                <TradingFormFeesDisclamer />
            </Column>
        </Card>
    );
};
