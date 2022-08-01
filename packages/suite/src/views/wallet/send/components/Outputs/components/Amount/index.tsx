import React, { useCallback } from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { Input, Icon, Button, variables, useTheme } from '@trezor/components';
import { FiatValue, Translation } from '@suite-components';
import { InputError } from '@wallet-components';
import {
    amountToSatoshi,
    formatNetworkAmount,
    hasNetworkFeatures,
    isDecimalsValid,
    isInteger,
    getInputState,
    findToken,
} from '@suite-common/wallet-utils';
import { useSendFormContext } from '@wallet-hooks';
import { Output } from '@wallet-types/sendForm';
import { MAX_LENGTH } from '@suite-constants/inputs';

import TokenSelect from './components/TokenSelect';
import Fiat from './components/Fiat';
import { useBitcoinAmountUnit } from '@wallet-hooks/useBitcoinAmountUnit';

const Wrapper = styled.div`
    display: flex;
    flex: 1;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex-direction: column;
    }
`;

const Text = styled.div`
    margin-right: 3px;
`;

const StyledInput = styled(Input)`
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
interface Props {
    output: Partial<Output>;
    outputId: number;
}
const Amount = ({ output, outputId }: Props) => {
    const {
        account,
        network,
        feeInfo,
        localCurrencyOption,
        register,
        getDefaultValue,
        errors,
        setValue,
        setMax,
        calculateFiat,
        composeTransaction,
    } = useSendFormContext();

    const { symbol, tokens, availableBalance, balance } = account;

    const theme = useTheme();
    const { areSatsDisplayed, areUnitsSupportedByNetwork, areUnitsSupportedByDevice } =
        useBitcoinAmountUnit(symbol);
    const areSatsUsed = areSatsDisplayed && areUnitsSupportedByNetwork && areUnitsSupportedByDevice;

    const inputName = `outputs[${outputId}].amount`;
    const tokenInputName = `outputs[${outputId}].token`;
    const isSetMaxActive = getDefaultValue('setMaxOutputId') === outputId;
    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const error = outputError ? outputError.amount : undefined;
    // corner-case: do not display "setMax" button if FormState got ANY error (setMax probably cannot be calculated)
    const isSetMaxVisible = isSetMaxActive || error || Object.keys(errors).length === 0;

    const amountValue = getDefaultValue(inputName, output.amount || '');
    const tokenValue = getDefaultValue(tokenInputName, output.token);
    const token = findToken(tokens, tokenValue);

    const tokenBalance = token ? (
        <TokenBalanceValue>{`${token.balance} ${token.symbol!.toUpperCase()}`}</TokenBalanceValue>
    ) : undefined;

    let decimals: number;
    if (token) {
        decimals = token.decimals;
    } else if (areSatsUsed) {
        decimals = 0;
    } else {
        decimals = network.decimals;
    }

    const withTokens = hasNetworkFeatures(account, 'tokens');
    const symbolToUse = areSatsDisplayed ? 'sats' : symbol.toUpperCase();

    const handleInputChange = useCallback(
        event => {
            if (isSetMaxActive) {
                setValue('setMaxOutputId', undefined);
            }

            const eventValue = event.target.value;

            // calculate or reset Fiat value
            calculateFiat(outputId, !error ? eventValue : undefined);

            composeTransaction(inputName);
        },
        [setValue, calculateFiat, composeTransaction, error, inputName, isSetMaxActive, outputId],
    );

    const cryptoAmountRef = register({
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
                rawDust && (areSatsDisplayed ? rawDust : formatNetworkAmount(rawDust, symbol));

            if (dust && amountBig.lte(dust)) {
                if (areSatsUsed) {
                    dust = amountToSatoshi(dust, decimals);
                }

                return (
                    <Translation
                        key="AMOUNT_IS_BELOW_DUST"
                        id="AMOUNT_IS_BELOW_DUST"
                        values={{ dust: `${dust} ${areSatsUsed ? 'sats' : symbol.toUpperCase()}` }}
                    />
                );
            }

            let formattedAvailableBalance: string;

            if (token) {
                formattedAvailableBalance = token.balance || '0';
            } else {
                formattedAvailableBalance = areSatsDisplayed
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
                        <Translation
                            key="AMOUNT_IS_MORE_THAN_RESERVE"
                            id="AMOUNT_IS_MORE_THAN_RESERVE"
                            values={{ reserve }}
                        />
                    );
                }
                return 'AMOUNT_IS_NOT_ENOUGH';
            }
        },
    });

    return (
        <Wrapper>
            <Left>
                <StyledInput
                    inputState={getInputState(error, amountValue)}
                    isMonospace
                    labelAddonIsVisible={isSetMaxActive}
                    labelAddon={
                        isSetMaxVisible ? (
                            <Button
                                icon={isSetMaxActive ? 'CHECK' : 'SEND'}
                                data-test={`outputs[${outputId}].setMax`}
                                onClick={() => {
                                    setMax(outputId, isSetMaxActive);
                                    composeTransaction(inputName);
                                }}
                                variant="tertiary"
                            >
                                <Translation id="AMOUNT_SEND_MAX" />
                            </Button>
                        ) : undefined
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
                    bottomText={<InputError error={error} />}
                    onChange={handleInputChange}
                    name={inputName}
                    data-test={inputName}
                    defaultValue={amountValue}
                    maxLength={MAX_LENGTH.AMOUNT}
                    innerRef={cryptoAmountRef}
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
        </Wrapper>
    );
};

export default Amount;
