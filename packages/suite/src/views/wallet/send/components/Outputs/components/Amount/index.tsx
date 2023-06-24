import React, { useCallback, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';

import { Icon, Switch, Warning, variables, useTheme } from '@trezor/components';
import { FiatValue, Translation, NumberInput, HiddenPlaceholder } from 'src/components/suite';
import { InputError } from 'src/components/wallet';
import {
    amountToSatoshi,
    formatNetworkAmount,
    hasNetworkFeatures,
    isDecimalsValid,
    isInteger,
    isLowAnonymityWarning,
    getInputState,
    findToken,
} from '@suite-common/wallet-utils';
import { useSendFormContext } from 'src/hooks/wallet';
import { Output } from 'src/types/wallet/sendForm';
import { MAX_LENGTH } from 'src/constants/suite/inputs';
import { TokenSelect } from './components/TokenSelect';
import { Fiat } from './components/Fiat';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { TypedValidationRules } from 'src/types/wallet/form';

const Row = styled.div`
    display: flex;
    flex: 1;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex-direction: column;
    }
`;

const Text = styled.div`
    margin-right: 3px;
`;

const SwitchWrapper = styled.div`
    align-items: center;
    display: flex;
    gap: 4px;
`;

const SwitchLabel = styled.label`
    font-size: 14px;
    font-weight: 500;
`;

const StyledInput = styled(NumberInput)`
    display: flex;
    flex: 1;
`;

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
    padding: 0px 6px;
    font-size: ${variables.NEUE_FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const TokenBalanceValue = styled.span`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const StyledTransferIcon = styled(Icon)`
    @media all and (max-width: ${variables.SCREEN_SIZE.LG}) {
        transform: rotate(90deg);
    }
`;
const TransferIconWrapper = styled.div`
    margin: 45px 20px 0px 20px;

    @media all and (max-width: ${variables.SCREEN_SIZE.LG}) {
        /* transform: rotate(90deg); */
        align-self: center;
        margin: 0px;
    }
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    align-items: flex-start;
`;

const Symbol = styled.span`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledWarning = styled(Warning)`
    margin-bottom: 8px;
`;

interface Props {
    output: Partial<Output>;
    outputId: number;
}
export const Amount = ({ output, outputId }: Props) => {
    const {
        account,
        network,
        feeInfo,
        localCurrencyOption,
        control,
        getDefaultValue,
        errors,
        setValue,
        setMax,
        calculateFiat,
        composeTransaction,
    } = useSendFormContext();
    const { symbol, tokens, availableBalance, balance } = account;

    const theme = useTheme();
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);

    const inputName = `outputs[${outputId}].amount`;
    const tokenInputName = `outputs[${outputId}].token`;
    const isSetMaxActive = getDefaultValue('setMaxOutputId') === outputId;
    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const error = outputError ? outputError.amount : undefined;
    // corner-case: do not display "setMax" button if FormState got ANY error (setMax probably cannot be calculated)
    const isSetMaxVisible = isSetMaxActive && !error && !Object.keys(errors).length;
    const maxSwitchId = `outputs[${outputId}].setMax`;

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
    const bottomText = isLowAnonymity ? null : <InputError error={error} />;

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

    const cryptoAmountRules = useMemo<TypedValidationRules>(
        () => ({
            required: 'AMOUNT_IS_NOT_SET',
            validate: (value: string) => {
                if (Number.isNaN(Number(value))) {
                    return 'AMOUNT_IS_NOT_NUMBER';
                }

                // ERC20 without decimal places
                if (!decimals && !isInteger(value)) {
                    return 'AMOUNT_IS_NOT_INTEGER';
                }

                if (!isDecimalsValid(value, decimals)) {
                    return (
                        <Translation
                            key="AMOUNT_IS_NOT_IN_RANGE_DECIMALS"
                            id="AMOUNT_IS_NOT_IN_RANGE_DECIMALS"
                            values={{ decimals }}
                        />
                    );
                }

                const amountBig = new BigNumber(value);

                if (amountBig.lt(0)) {
                    return 'AMOUNT_IS_TOO_LOW';
                }

                // allow 0 amount ONLY for ethereum transaction with data
                if (amountBig.eq(0) && !getDefaultValue('ethereumDataHex')) {
                    return 'AMOUNT_IS_TOO_LOW';
                }

                const rawDust = feeInfo?.dustLimit?.toString();

                // amounts below dust are not allowed
                let dust =
                    rawDust && (shouldSendInSats ? rawDust : formatNetworkAmount(rawDust, symbol));

                if (dust && amountBig.lte(dust)) {
                    if (shouldSendInSats) {
                        dust = amountToSatoshi(dust, decimals);
                    }

                    return (
                        <Translation
                            key="AMOUNT_IS_BELOW_DUST"
                            id="AMOUNT_IS_BELOW_DUST"
                            values={{
                                dust: `${dust} ${shouldSendInSats ? 'sat' : symbol.toUpperCase()}`,
                            }}
                        />
                    );
                }

                let formattedAvailableBalance: string;

                if (token) {
                    formattedAvailableBalance = token.balance || '0';
                } else {
                    formattedAvailableBalance = shouldSendInSats
                        ? availableBalance
                        : formatNetworkAmount(availableBalance, symbol);
                }

                if (amountBig.gt(formattedAvailableBalance)) {
                    const reserve =
                        account.networkType === 'ripple'
                            ? formatNetworkAmount(account.misc.reserve, symbol)
                            : undefined;

                    if (reserve && amountBig.lt(formatNetworkAmount(balance, symbol))) {
                        return (
                            <Translation id="AMOUNT_IS_MORE_THAN_RESERVE" values={{ reserve }} />
                        );
                    }
                    return 'AMOUNT_IS_NOT_ENOUGH';
                }
            },
        }),
        [
            account?.misc,
            account.networkType,
            availableBalance,
            balance,
            decimals,
            feeInfo?.dustLimit,
            getDefaultValue,
            shouldSendInSats,
            symbol,
            token,
        ],
    );

    return (
        <>
            <Row>
                <Left>
                    <StyledInput
                        inputState={inputState}
                        isMonospace
                        labelAddonIsVisible={isSetMaxVisible}
                        labelAddon={
                            <SwitchWrapper>
                                <Switch
                                    isSmall
                                    isChecked={isSetMaxActive}
                                    id={maxSwitchId}
                                    dataTest={maxSwitchId}
                                    onChange={() => {
                                        setMax(outputId, isSetMaxActive);
                                        composeTransaction(inputName);
                                    }}
                                />
                                <SwitchLabel htmlFor={maxSwitchId}>
                                    <Translation id="AMOUNT_SEND_MAX" />
                                </SwitchLabel>
                            </SwitchWrapper>
                        }
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
                        bottomText={bottomText}
                        onChange={handleInputChange}
                        name={inputName}
                        data-test={inputName}
                        defaultValue={amountValue}
                        maxLength={MAX_LENGTH.AMOUNT}
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

                {/* TODO: token FIAT rates calculation */}
                {!token && (
                    <FiatValue amount="1" symbol={symbol} fiatCurrency={localCurrencyOption.value}>
                        {({ rate }) =>
                            rate && (
                                <>
                                    <TransferIconWrapper>
                                        <StyledTransferIcon
                                            icon="TRANSFER"
                                            size={16}
                                            color={theme.TYPE_LIGHT_GREY}
                                        />
                                    </TransferIconWrapper>

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
