import { ExperimentId } from '@suite-common/message-system';
import {
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingExchangeFormProps,
    TradingExchangeType,
    selectTradingLoadingAndTimestamp,
} from '@suite-common/trading';
import { TokenAddress } from '@suite-common/wallet-types';
import { convertAmountSubunitsToUnits } from '@suite-common/wallet-utils';
import { Card, Column, Divider, FractionButton, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { ExperimentWrapper } from 'src/components/suite/Experiment/ExperimentWrapper';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { getTradingNetworkDecimals } from 'src/utils/wallet/trading/tradingUtils';
import { TradingBalance } from 'src/views/wallet/trading/common/TradingBalance';
import { TradingFormInputAccount } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputAccount';
import { TradingFormInputCryptoSelect } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputCryptoSelect/TradingFormInputCryptoSelect';
import { TradingFormInputFiatCrypto } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputFiatCrypto';
import { TradingFormSwitcherExchangeRates } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormSwitcherExchangeRates';

import { TradingFormFeesDisclamer } from './TradingFormFeeDisclamer';
import { generateFractionButtons } from './tradingFormInputsUtils';
import { TradingReceiveAddress } from '../TradingSelectedOffer/TradingReceiveAddress/TradingReceiveAddress';

export const TradingExchangeFormInputs = () => {
    const context = useTradingFormContext<TradingExchangeType>();

    const { isLoading } = useSelector(selectTradingLoadingAndTimestamp);

    const {
        feeInfo,
        account,
        composedLevels,
        form: { helpers },
        exchangeInfo,
        getValues,
        setValue,
        changeFeeLevel,
        shouldSendInSats,
    } = context;
    const { rateType, sendCryptoSelect, receiveCryptoSelect, outputs, amountInCrypto } =
        getValues();
    const output = outputs[0];
    const currencySelect = output.currency;
    const tokenAddress = (output.token ?? undefined) as TokenAddress | undefined;
    const supportedCryptoCurrencies = exchangeInfo?.buyCryptoIds;
    const outputAmount =
        shouldSendInSats && output.amount
            ? convertAmountSubunitsToUnits(
                  output.amount,
                  getTradingNetworkDecimals({ sendCryptoSelect }),
              )
            : output.amount;

    const receiveCryptoId = receiveCryptoSelect?.value;

    return (
        <Card paddingType="none">
            <Column gap={spacings.lg} padding={{ vertical: spacings.lg, horizontal: spacings.lg }}>
                <TradingFormInputAccount<TradingExchangeFormProps>
                    accountSelectName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                    label="TR_FROM"
                    data-testid="@trading/form/trade-from/select-crypto"
                    methods={{ ...context }}
                />
                <Column gap={spacings.xs}>
                    <TradingFormInputFiatCrypto<TradingExchangeFormProps>
                        cryptoInputName={TRADING_FORM_OUTPUT_AMOUNT}
                        fiatInputName={TRADING_FORM_OUTPUT_FIAT}
                        cryptoSelectName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
                        currencySelectLabel={currencySelect.label}
                        cryptoCurrencyLabel={sendCryptoSelect?.value}
                        methods={{ ...context }}
                    />
                    {amountInCrypto && (
                        <Row justifyContent="space-between" alignItems="flex-start">
                            <Row gap={spacings.xs}>
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
                <TradingFormInputCryptoSelect<TradingExchangeFormProps>
                    placeholder="TR_SELECT_TOKEN"
                    label="TR_TO"
                    cryptoSelectName={TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT}
                    supportedCryptoCurrencies={supportedCryptoCurrencies}
                    methods={{ ...context }}
                    sortTokensByFiatBalanceInDesc={true}
                />
            </Column>

            {receiveCryptoId && !isLoading && <TradingReceiveAddress />}

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
