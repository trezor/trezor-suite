import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { Translation } from '@suite/intl';
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
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { Column, Row } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useFetchFees } from 'src/components/wallet/Fees/CollapsibleFees/hooks/useFetchFees';
import { useSelector } from 'src/hooks/suite';
import { useSelectedTradingAsset } from 'src/hooks/wallet/trading/form/common/useSelectedTradingAsset';
import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingBalance } from 'src/views/wallet/trading/common/TradingBalance';
import { TradingFormInputCryptoAmount } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputCryptoAmount';

import { TradingFormCard } from './TradingFormCard';
import { TradingReceiveAddress } from '../TradingSelectedOffer/TradingReceiveAddress/TradingReceiveAddress';
import { TradingSelectedOfferProvider } from '../TradingSelectedOffer/TradingSelectedOfferProvider';
import { AssetPickerInputBalance } from './TradingFormInput/TradingFormInputAssetPicker';
import { TradingFormInputBuyAsset } from './TradingFormInput/TradingFormInputBuyAsset/TradingFormInputBuyAsset';
import { TradingFormInputSellAsset } from './TradingFormInput/TradingFormInputSellAsset/TradingFormInputSellAsset';
import { TradingFormSection } from './TradingFormSection';
import { TradingFractionButtons } from './TradingFractionButtons';
import { TradingNetworkReserveBanner } from './TradingNetworkReserveBanner';
import { useTradingExchangeAssetSelect } from './useTradingExchangeAssetSelect';

export const TradingExchangeFormInputs = () => {
    const context = useTradingFormContext<TradingExchangeType>();

    const { isLoading } = useSelector(selectTradingLoadingAndTimestamp);

    const {
        type,
        form: { helpers },
        shouldSendInSats,
        showReserveBanner,
        setAmountLimits,
    } = context;
    const asset = useSelectedTradingAsset(type);
    const account = useSelector(state => selectTradingSendAccount(state, type));

    useFetchFees({ networkSymbol: account?.symbol });

    const methods = useFormContext<TradingExchangeFormProps>();
    const { getValues } = methods;
    const {
        [TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT]: sendCryptoSelect,
        [TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT]: receiveCryptoSelect,
        outputs,
        amountInCrypto,
    } = getValues();

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
    const outputAmount =
        shouldSendInSats && output?.amount
            ? subunitsToUnits({
                  value: asAmountSubunit(new BigNumber(output.amount)),
                  decimals: sendAssetDecimals,
              }).toString()
            : output?.amount;

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
                        inputPlaceholder="TR_SELECT_TOKEN"
                        onAssetSelect={handleSellAssetSelect}
                    />
                    <Column gap={8}>
                        <TradingFormInputCryptoAmount
                            cryptoInputName={TRADING_FORM_OUTPUT_AMOUNT}
                            fiatInputName={TRADING_FORM_OUTPUT_FIAT}
                            cryptoSelectName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                            labelLeft={<Translation id="TR_TRADING_YOU_PAY" />}
                        />
                        {amountInCrypto && !!sendCryptoSelect && asset && (
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

                    {showReserveBanner && !!sendCryptoSelect && asset && (
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
                        onAssetSelect={handleReceiveAssetSelect}
                    />
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
