import { BigNumber } from '@trezor/utils/src/bigNumber';
import { Icon, Banner, Flex, Row, Text, variables, useMediaQuery } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { formInputsMaxLength } from '@suite-common/validators';
import { Output, TokenAddress } from '@suite-common/wallet-types';
import {
    amountToSmallestUnit,
    formatNetworkAmount,
    hasNetworkFeatures,
    isLowAnonymityWarning,
    getInputState,
    findToken,
} from '@suite-common/wallet-utils';

import { FiatValue, Translation, NumberInput, HiddenPlaceholder } from 'src/components/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { useTranslation } from 'src/hooks/suite';
import {
    validateDecimals,
    validateInteger,
    validateMin,
    validateReserveOrBalance,
} from 'src/utils/suite/validation';
import { formatTokenSymbol } from 'src/utils/wallet/tokenUtils';

import { TokenSelect } from './TokenSelect';
import { FiatInput } from './FiatInput';
import { SendMaxSwitch } from './SendMaxSwitch';

type AmountProps = {
    output: Partial<Output>;
    outputId: number;
};
export const Amount = ({ output, outputId }: AmountProps) => {
    const { translationString } = useTranslation();
    const {
        account,
        network,
        feeInfo,
        localCurrencyOption,
        control,
        getDefaultValue,
        handleAmountChange,
        formState: { errors },
        setMax,
        composeTransaction,
        getCurrentFiatRate,
    } = useSendFormContext();
    const { symbol, tokens } = account;
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);
    const isBelowLaptop = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.LG})`);

    const amountName = `outputs.${outputId}.amount` as const;
    const tokenInputName = `outputs.${outputId}.token`;
    const isSetMaxActive = getDefaultValue('setMaxOutputId') === outputId;
    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const error = outputError ? outputError.amount : undefined;

    // corner-case: do not display "setMax" button if FormState got ANY error (setMax probably cannot be calculated)
    const isSetMaxVisible = isSetMaxActive && !error && !Object.keys(errors).length;
    const maxSwitchId = `outputs.${outputId}.setMax`;

    const amountValue = getDefaultValue(amountName, output.amount || '');
    const tokenValue = getDefaultValue(tokenInputName, output.token);
    const token = findToken(tokens, tokenValue);

    const currentRate = getCurrentFiatRate({
        tokenAddress: (token?.contract ?? '') as TokenAddress,
        currencyCode: (output.currency?.value ?? '') as FiatCurrencyCode,
    });

    const isWithRate = !!currentRate?.rate || !!currentRate?.isLoading;

    let decimals: number;
    if (token) {
        decimals = token.decimals;
    } else if (shouldSendInSats) {
        decimals = 0;
    } else {
        decimals = network.decimals;
    }

    const withTokens = hasNetworkFeatures(account, 'tokens');
    const symbolToUse = shouldSendInSats ? 'sat' : symbol.toUpperCase();
    const isLowAnonymity = isLowAnonymityWarning(outputError);
    const inputState = isLowAnonymity ? 'warning' : getInputState(error);
    const bottomText = isLowAnonymity ? undefined : error?.message;

    const handleInputChange = (value: string) => handleAmountChange({ outputId, value });

    const cryptoAmountRules = {
        required: translationString('AMOUNT_IS_NOT_SET'),
        validate: {
            // allow 0 amount ONLY for ethereum transaction with data
            min: validateMin(translationString, { except: !!getDefaultValue('ethereumDataHex') }),
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
                        dust = amountToSmallestUnit(dust, decimals);
                    }

                    return translationString('AMOUNT_IS_BELOW_DUST', {
                        dust: `${dust} ${shouldSendInSats ? 'sat' : symbol.toUpperCase()}`,
                    });
                }
            },
            reserveOrBalance: validateReserveOrBalance(translationString, {
                account,
                areSatsUsed: !!shouldSendInSats,
                tokenAddress: tokenValue,
            }),
        },
    };

    const onSwitchChange = () => {
        setMax(outputId, isSetMaxActive);
        composeTransaction(amountName);
    };

    const isTokenSelected = !!token;
    const tokenBalance = isTokenSelected ? (
        <HiddenPlaceholder>
            {`${token.balance} ${formatTokenSymbol(token?.symbol || token.contract)}`}
        </HiddenPlaceholder>
    ) : undefined;

    const sendMaxSwitch = (
        <SendMaxSwitch
            isSetMaxActive={isSetMaxActive}
            data-testid={maxSwitchId}
            onChange={onSwitchChange}
        />
    );

    return (
        <>
            <Flex
                direction={isBelowLaptop ? 'column' : 'row'}
                alignItems="normal"
                gap={spacings.sm}
            >
                <NumberInput
                    inputState={inputState}
                    labelHoverRight={
                        !isSetMaxVisible && (!isWithRate || isBelowLaptop) && sendMaxSwitch
                    }
                    labelRight={isSetMaxVisible && (!isWithRate || isBelowLaptop) && sendMaxSwitch}
                    labelLeft={
                        <Row gap={spacings.sm} alignItems="baseline">
                            <Translation id="AMOUNT" />
                            {isTokenSelected && (
                                <Text variant="tertiary" typographyStyle="label">
                                    (
                                    <Translation
                                        id="TOKEN_BALANCE"
                                        values={{ balance: tokenBalance }}
                                    />
                                    )
                                </Text>
                            )}
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
                    innerAddon={
                        withTokens ? (
                            <TokenSelect output={output} outputId={outputId} />
                        ) : (
                            <Text variant="tertiary" typographyStyle="hint">
                                {symbolToUse}
                            </Text>
                        )
                    }
                />

                {isWithRate && (
                    <FiatValue amount="1" symbol={symbol} fiatCurrency={localCurrencyOption.value}>
                        {({ rate }) =>
                            rate && (
                                <>
                                    <Icon
                                        name={isBelowLaptop ? 'arrowsDownUp' : 'arrowsLeftRight'}
                                        size={20}
                                        variant="tertiary"
                                        margin={{ top: isBelowLaptop ? 0 : spacings.xxxxl }}
                                    />
                                    <FiatInput
                                        output={output}
                                        outputId={outputId}
                                        // To fix alignment with the other input
                                        labelLeft={isBelowLaptop ? undefined : <>&nbsp;</>}
                                        labelRight={!isBelowLaptop && sendMaxSwitch}
                                    />
                                </>
                            )
                        }
                    </FiatValue>
                )}
            </Flex>

            {isLowAnonymity && (
                <Banner icon margin={{ top: spacings.sm }}>
                    <Translation id="TR_NOT_ENOUGH_ANONYMIZED_FUNDS_WARNING" />
                </Banner>
            )}
        </>
    );
};
