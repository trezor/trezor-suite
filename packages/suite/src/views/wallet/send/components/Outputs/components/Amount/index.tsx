import { useCallback } from 'react';
import BigNumber from 'bignumber.js';
import styled, { useTheme } from 'styled-components';

import { Icon, Switch, Warning, variables } from '@trezor/components';
import { FiatValue, Translation, NumberInput, HiddenPlaceholder } from 'src/components/suite';
import {
    amountToSatoshi,
    formatNetworkAmount,
    hasNetworkFeatures,
    isLowAnonymityWarning,
    getInputState,
    findToken,
} from '@suite-common/wallet-utils';
import { useSendFormContext } from 'src/hooks/wallet';
import { Output } from 'src/types/wallet/sendForm';
import { formInputsMaxLength } from '@suite-common/validators';
import { TokenSelect } from './components/TokenSelect';
import { Fiat } from './components/Fiat';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { useTranslation } from 'src/hooks/suite';
import {
    validateDecimals,
    validateInteger,
    validateMin,
    validateReserveOrBalance,
} from 'src/utils/suite/validation';
import { spacingsPx } from '@trezor/theme';
import { breakpointMediaQueries } from '@trezor/styles';

const Row = styled.div`
    position: relative;
    display: flex;
    flex: 1;

    ${breakpointMediaQueries.below_lg} {
        flex-direction: column;
        gap: ${spacingsPx.sm};
    }
`;

const Heading = styled.p`
    position: absolute;
`;

const Text = styled.div`
    margin-right: 3px;
`;

const AmountInput = styled(NumberInput)`
    display: flex;
    flex: 1;
` as typeof NumberInput; // Styled wrapper doesn't preserve type argument, see https://github.com/styled-components/styled-components/issues/1803#issuecomment-857092410

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const Left = styled.div`
    position: relative; /* for TokenBalance positioning */
    display: flex;
    flex: 1;
`;

const TokenBalance = styled.div`
    padding: 0 6px;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const TokenBalanceValue = styled.span`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const StyledTransferIcon = styled(Icon)`
    margin: 50px 20px 0;

    @media all and (max-width: ${variables.SCREEN_SIZE.LG}) {
        align-self: center;
        margin: 0;
        transform: rotate(90deg);
    }
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    align-items: end;
`;

const Symbol = styled.span`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledWarning = styled(Warning)`
    margin-bottom: 8px;
`;

interface AmountProps {
    output: Partial<Output>;
    outputId: number;
}
export const Amount = ({ output, outputId }: AmountProps) => {
    const { translationString } = useTranslation();
    const {
        account,
        network,
        feeInfo,
        localCurrencyOption,
        control,
        getDefaultValue,
        formState: { errors },
        setValue,
        setMax,
        calculateFiat,
        composeTransaction,
    } = useSendFormContext();
    const { symbol, tokens } = account;

    const theme = useTheme();
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);

    const inputName = `outputs.${outputId}.amount` as const;
    const tokenInputName = `outputs.${outputId}.token`;
    const isSetMaxActive = getDefaultValue('setMaxOutputId') === outputId;
    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const error = outputError ? outputError.amount : undefined;
    // corner-case: do not display "setMax" button if FormState got ANY error (setMax probably cannot be calculated)
    const isSetMaxVisible = isSetMaxActive && !error && !Object.keys(errors).length;
    const maxSwitchId = `outputs.${outputId}.setMax`;

    const amountValue = getDefaultValue(inputName, output.amount || '');
    const tokenValue = getDefaultValue(tokenInputName, output.token);
    const token = findToken(tokens, tokenValue);

    const tokenBalance = token ? (
        <HiddenPlaceholder>
            <TokenBalanceValue>{`${
                token.balance
            } ${token.symbol!.toUpperCase()}`}</TokenBalanceValue>
        </HiddenPlaceholder>
    ) : undefined;

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
    const inputState = isLowAnonymity ? 'warning' : getInputState(error, amountValue);
    const bottomText = isLowAnonymity ? undefined : error?.message;

    const handleInputChange = useCallback(
        (value: string) => {
            if (isSetMaxActive) {
                setValue('setMaxOutputId', undefined);
            }

            // calculate or reset Fiat value
            calculateFiat(outputId, value);
            composeTransaction(inputName);
        },
        [setValue, calculateFiat, composeTransaction, inputName, isSetMaxActive, outputId],
    );

    const cryptoAmountRules = {
        required: translationString('AMOUNT_IS_NOT_SET'),
        validate: {
            // allow 0 amount ONLY for ethereum transaction with data
            min: validateMin(translationString, { except: !!getDefaultValue('ethereumDataHex') }),
            // ERC20 without decimal places
            integer: validateInteger(translationString, { except: !!decimals }),
            decimals: validateDecimals(translationString, { decimals }),
            dust: (value: string) => {
                const amountBig = new BigNumber(value);

                const rawDust = feeInfo?.dustLimit?.toString();

                // amounts below dust are not allowed
                let dust =
                    rawDust && (shouldSendInSats ? rawDust : formatNetworkAmount(rawDust, symbol));

                if (dust && amountBig.lt(dust)) {
                    if (shouldSendInSats) {
                        dust = amountToSatoshi(dust, decimals);
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

    const SendMaxSwitch = () => (
        <Switch
            labelPosition="left"
            isChecked={isSetMaxActive}
            dataTest={maxSwitchId}
            isSmall
            onChange={() => {
                setMax(outputId, isSetMaxActive);
                composeTransaction(inputName);
            }}
            label={<Translation id="AMOUNT_SEND_MAX" />}
        />
    );

    return (
        <>
            <Row>
                <Heading>
                    <Translation id="AMOUNT" />
                </Heading>

                <Left>
                    <AmountInput
                        inputState={inputState}
                        labelHoverAddon={!isSetMaxVisible ? <SendMaxSwitch /> : undefined}
                        labelRight={isSetMaxVisible ? <SendMaxSwitch /> : undefined}
                        label={
                            <Label>
                                <Text>
                                    <Translation id="AMOUNT" />
                                </Text>

                                {tokenBalance && (
                                    <TokenBalance>
                                        <Translation
                                            id="TOKEN_BALANCE"
                                            values={{ balance: tokenBalance }}
                                        />
                                    </TokenBalance>
                                )}
                            </Label>
                        }
                        bottomText={bottomText || null}
                        onChange={handleInputChange}
                        name={inputName}
                        data-test={inputName}
                        defaultValue={amountValue}
                        maxLength={formInputsMaxLength.amount}
                        rules={cryptoAmountRules}
                        control={control}
                        innerAddon={
                            withTokens ? (
                                <TokenSelect output={output} outputId={outputId} />
                            ) : (
                                <Symbol>{symbolToUse}</Symbol>
                            )
                        }
                    />
                </Left>

                {!token && (
                    <FiatValue amount="1" symbol={symbol} fiatCurrency={localCurrencyOption.value}>
                        {({ rate }) =>
                            rate && (
                                <>
                                    <StyledTransferIcon
                                        icon="TRANSFER"
                                        size={16}
                                        color={theme.TYPE_LIGHT_GREY}
                                    />

                                    <Right>
                                        <Fiat output={output} outputId={outputId} />
                                    </Right>
                                </>
                            )
                        }
                    </FiatValue>
                )}
            </Row>

            {isLowAnonymity && (
                <StyledWarning withIcon>
                    <Translation id="TR_NOT_ENOUGH_ANONYMIZED_FUNDS_WARNING" />
                </StyledWarning>
            )}
        </>
    );
};
