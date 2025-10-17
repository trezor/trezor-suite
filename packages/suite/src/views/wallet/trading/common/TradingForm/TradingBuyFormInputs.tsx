import { ExperimentId } from '@suite-common/message-system';
import {
    TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_CRYPTO_INPUT,
    TRADING_FORM_FIAT_INPUT,
    type TradingBuyFormProps,
    TradingBuyType,
    cryptoIdToNetworkAndContractAddress,
    selectTradingLoadingAndTimestamp,
} from '@suite-common/trading';
import { TokenAddress } from '@suite-common/wallet-types';
import { Card, Column, Row } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils/src/firmwareUtils';
import { spacings } from '@trezor/theme';

import { ExperimentWrapper } from 'src/components/suite/Experiment/ExperimentWrapper';
import { useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingBalance } from 'src/views/wallet/trading/common/TradingBalance';
import { TradingFormInputCountry } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputCountry';
import { TradingFormInputCryptoSelect } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputCryptoSelect/TradingFormInputCryptoSelect';
import { TradingFormInputFiatCrypto } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputFiatCrypto';
import { TradingFormInputPaymentMethod } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputPaymentMethod';

import { TradingFormFeesDisclamer } from './TradingFormFeeDisclamer';
import { TradingReceiveAddress } from '../TradingSelectedOffer/TradingReceiveAddress/TradingReceiveAddress';

export const TradingBuyFormInputs = () => {
    const context = useTradingFormContext<TradingBuyType>();

    const { isLoading } = useSelector(selectTradingLoadingAndTimestamp);

    const { buyInfo, device } = context;
    const { currencySelect, cryptoSelect, amountInCrypto, cryptoInput } = context.getValues();
    const supportedCryptoCurrencies = buyInfo?.supportedCryptoCurrencies;

    const tokenAddress = (cryptoSelect.contractAddress as TokenAddress | null) ?? undefined;
    const { network } = cryptoIdToNetworkAndContractAddress(cryptoSelect.value);

    const cryptoId = cryptoSelect.value;

    return (
        <Column gap={spacings.lg}>
            <Card paddingType="none">
                <Column gap={spacings.lg}>
                    <Column
                        gap={spacings.lg}
                        padding={{
                            vertical: spacings.md,
                            horizontal: spacings.lg,
                            bottom: cryptoId && !isLoading ? 0 : spacings.md,
                        }}
                    >
                        <Column gap={spacings.xs}>
                            <TradingFormInputFiatCrypto<TradingBuyFormProps>
                                cryptoInputName={TRADING_FORM_CRYPTO_INPUT}
                                fiatInputName={TRADING_FORM_FIAT_INPUT}
                                cryptoSelectName={TRADING_FORM_CRYPTO_CURRENCY_SELECT}
                                currencySelectLabel={currencySelect.label}
                                cryptoCurrencyLabel={cryptoSelect.value}
                                methods={{ ...context }}
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
                                            element: network?.symbol ? (
                                                <Row justifyContent="end">
                                                    <TradingBalance
                                                        balance={cryptoInput}
                                                        displaySymbol={cryptoSelect?.label}
                                                        symbol={network?.symbol}
                                                        tokenAddress={tokenAddress}
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

                        <TradingFormInputCryptoSelect<TradingBuyFormProps>
                            label="TR_TRADING_YOU_BUY"
                            cryptoSelectName={TRADING_FORM_CRYPTO_CURRENCY_SELECT}
                            supportedCryptoCurrencies={supportedCryptoCurrencies}
                            methods={{ ...context }}
                            isDisabled={hasBitcoinOnlyFirmware(device)}
                            sortTokensByFiatBalanceInDesc={false}
                        />
                    </Column>

                    {cryptoId && !isLoading && <TradingReceiveAddress />}
                </Column>
            </Card>

            <Card>
                <Column gap={spacings.lg}>
                    <TradingFormInputPaymentMethod label="TR_TRADING_PAYMENT_METHOD" />
                    <TradingFormInputCountry label="TR_TRADING_COUNTRY" />
                    <TradingFormFeesDisclamer />
                </Column>
            </Card>
        </Column>
    );
};
