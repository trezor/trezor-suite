import { useEffect } from 'react';

import { events } from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
import { formInputsMaxLength } from '@suite-common/validators';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { selectIsNetworkReserveEnabled } from '@suite-common/wallet-core';
import { type Output, type TokenAddress } from '@suite-common/wallet-types';
import {
    convertAmountUnitsToSubunits,
    findToken,
    formatNetworkAmount,
    getNetworkReserve,
    hasNetworkFeatures,
    isLowAnonymityWarning,
} from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { Banner, Flex, Icon, Row, Text } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';
import { spacings } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue } from 'src/components/suite';
import { useLayoutSize, useSelector } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { selectLanguage } from 'src/selectors/suite/suiteSelectors';
import { useAnalytics } from 'src/support/useAnalytics';
import {
    validateDecimals,
    validateInteger,
    validateMin,
    validateNetworkReserve,
    validateReserveOrBalance,
} from 'src/utils/suite/validation';
import { getFeeInUnits } from 'src/utils/wallet/trading/tradingUtils';
import { TradingNetworkReserveBanner } from 'src/views/wallet/trading/common/TradingForm/TradingNetworkReserveBanner';

import { BaseCurrencyInput } from './BaseCurrencyInput';
import { SendMaxSwitch } from './SendMaxSwitch';

interface AmountProps {
    output: Partial<Output>;
    outputId: number;
}

export const Amount = ({ output, outputId }: AmountProps) => {
    const { translationString } = useTranslation();
    const analytics = useAnalytics();
    const {
        account,
        network,
        feeInfo,
        control,
        getDefaultValue,
        getValues,
        handleAmountChange,
        formState: { errors },
        setMax,
        composeTransaction,
        getCurrentFiatRate,
        watch,
        composedLevels,
        showReserveBanner,
        setShowReserveBanner,
    } = useSendFormContext();
    const { symbol, tokens } = account;
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);
    const { isBelowLaptop } = useLayoutSize();

    const locale = useSelector(selectLanguage);
    const isNetworkReserveEnabled = useSelector(selectIsNetworkReserveEnabled);

    const amountName = `outputs.${outputId}.amount` as const;
    const tokenInputName = `outputs.${outputId}.token`;
    const currencyInputName = `outputs.${outputId}.currency` as const;
    const maxOutputId = getDefaultValue('setMaxOutputId');
    const isSendMaxActive = maxOutputId === outputId;
    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const error = outputError ? outputError.amount : undefined;

    const selectedBaseCurrency = watch(currencyInputName);

    // corner-case: do not display "setMax" button if FormState got ANY error (setMax probably cannot be calculated)
    const isSendMaxVisible = isSendMaxActive && !error && !Object.keys(errors).length;
    const maxSwitchId = `outputs.${outputId}.setMax`;

    const amountValue = getDefaultValue(amountName, output.amount || '');
    const tokenValue = getDefaultValue(tokenInputName, output.token);
    const token = findToken(tokens, tokenValue);

    const currentRate = getCurrentFiatRate({
        tokenAddress: (token?.contract ?? '') as TokenAddress,
        currencyCode: (output.currency?.value ?? '') as BaseCurrencyCode,
    });

    const showBaseCurrency = !!currentRate?.rate || !!currentRate?.isLoading;
    const showTokenCurrency = selectedBaseCurrency.value !== symbol || !showBaseCurrency; // Show always at least one currency

    let decimals: number;
    if (token) {
        decimals = token.decimals;
    } else if (shouldSendInSats) {
        decimals = 0;
    } else {
        decimals = network.decimals;
    }

    const withTokens = hasNetworkFeatures(account, 'tokens');
    const displayTicker = shouldSendInSats ? 'sat' : getNetworkDisplaySymbol(symbol);
    const isLowAnonymity = isLowAnonymityWarning(outputError);
    const hasError = !!error;
    const bottomText = isLowAnonymity ? undefined : error?.message;

    const handleInputChange = (value: string) => handleAmountChange({ outputId, value });

    const feeInUnits = getFeeInUnits({
        symbol: account.symbol,
        composedLevels,
        selectedFee: getValues().selectedFee,
    });

    const isNetworkReserveError = error?.type === 'networkReserve';

    useEffect(() => {
        setShowReserveBanner(isNetworkReserveError);
    }, [isNetworkReserveError, setShowReserveBanner]);

    const cryptoAmountRules = {
        required: translationString('AMOUNT_IS_NOT_SET'),
        validate: {
            // allow 0 amount ONLY for ethereum transaction with data
            min: validateMin(translationString, { except: !!getDefaultValue('transactionData') }),
            integer: validateInteger(translationString, { except: !shouldSendInSats }),
            decimals: validateDecimals(translationString, { decimals }),
            dust: (value: string) => {
                const amountBig = new BigNumber(value);

                const rawDust = feeInfo?.dustLimit?.toString();

                // amounts below dust are not allowed
                let dust =
                    rawDust && (shouldSendInSats ? rawDust : formatNetworkAmount(rawDust, symbol));

                if (dust && amountBig.lt(dust)) {
                    if (shouldSendInSats) {
                        dust = convertAmountUnitsToSubunits(dust, decimals);
                    }

                    return translationString('AMOUNT_IS_BELOW_DUST', {
                        dust: `${dust} ${shouldSendInSats ? 'sat' : getNetworkDisplaySymbol(symbol)}`,
                    });
                }
            },
            reserveOrBalance: validateReserveOrBalance(translationString, {
                account,
                areSatsUsed: !!shouldSendInSats,
                contractAddress: tokenValue,
            }),
            networkReserve: isNetworkReserveEnabled
                ? validateNetworkReserve(translationString, {
                      reserve: getNetworkReserve({
                          symbol: account.symbol,
                          contractAddress: tokenValue,
                          isEnabled: isNetworkReserveEnabled,
                      }),
                      balance: account.formattedBalance,
                      fee: feeInUnits?.toString(),
                  })
                : () => undefined,
        },
    };

    const onSwitchChange = () => {
        if (!isSendMaxActive) {
            analytics.report({
                type: events.appFormPercentButtonsEvent.name,
                payload: { type: 'send', value: 'max' },
            });
        }
        const clearInput = network.networkType === 'solana';

        setMax(outputId, isSendMaxActive, clearInput);
        composeTransaction(amountName);
    };

    const sendMaxSwitch = (
        <SendMaxSwitch
            isSendMaxActive={isSendMaxActive}
            data-testid={maxSwitchId}
            onChange={onSwitchChange}
        />
    );

    return (
        <>
            <Flex
                direction={isBelowLaptop ? 'column' : 'row'}
                alignItems={isBelowLaptop ? 'center' : 'normal'}
                gap={spacings.sm}
            >
                {showTokenCurrency && (
                    <NumberInput
                        hasError={hasError}
                        locale={locale}
                        labelHoverRight={
                            !isSendMaxVisible &&
                            (!showBaseCurrency || isBelowLaptop) &&
                            sendMaxSwitch
                        }
                        labelRight={
                            isSendMaxVisible &&
                            (!showBaseCurrency || isBelowLaptop) &&
                            sendMaxSwitch
                        }
                        labelLeft={
                            <Row>
                                <Translation id="AMOUNT" />
                            </Row>
                        }
                        bottomText={bottomText || null}
                        onChange={handleInputChange}
                        name={amountName}
                        data-testid={amountName}
                        defaultValue={amountValue}
                        maxLength={formInputsMaxLength.amount}
                        rules={cryptoAmountRules}
                        control={control}
                        rightContent={
                            <Text intent="neutral" priority="secondary">
                                {withTokens && token ? token?.symbol : displayTicker}
                            </Text>
                        }
                    />
                )}

                {showBaseCurrency && (
                    <BaseCurrencyValue amount="1" symbol={symbol}>
                        {({ rate }) =>
                            rate && (
                                <>
                                    {showTokenCurrency && (
                                        <Icon
                                            name={
                                                isBelowLaptop ? 'arrowsDownUp' : 'arrowsLeftRight'
                                            }
                                            size={20}
                                            intent="neutral"
                                            priority="secondary"
                                            margin={{ top: isBelowLaptop ? 0 : spacings.xxxxl }}
                                        />
                                    )}
                                    <BaseCurrencyInput
                                        output={output}
                                        outputId={outputId}
                                        isSendMaxActive={isSendMaxActive}
                                        // To fix alignment with the other input
                                        labelLeft={isBelowLaptop ? undefined : <>&nbsp;</>}
                                        labelRight={!isBelowLaptop && sendMaxSwitch}
                                    />
                                </>
                            )
                        }
                    </BaseCurrencyValue>
                )}
            </Flex>

            {showReserveBanner && (
                <TradingNetworkReserveBanner
                    symbol={network.symbol}
                    contractAddress={tokenValue ?? undefined}
                />
            )}

            {isLowAnonymity && (
                <Banner
                    icon
                    margin={{ top: spacings.sm }}
                    description={<Translation id="TR_NOT_ENOUGH_ANONYMIZED_FUNDS_WARNING" />}
                />
            )}
        </>
    );
};
