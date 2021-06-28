import React from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { Input, Icon, Button, variables, useTheme } from '@trezor/components';
import { FiatValue, Translation } from '@suite-components';
import { InputError } from '@wallet-components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { getInputState, findToken } from '@wallet-utils/sendFormUtils';
import { isDecimalsValid, isInteger } from '@wallet-utils/validation';
import { useSendFormContext } from '@wallet-hooks';
import { Output } from '@wallet-types/sendForm';
import { MAX_LENGTH } from '@suite-constants/inputs';

import TokenSelect from './components/TokenSelect';
import Fiat from './components/Fiat';

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
    margin: 50px 20px 0px 20px;

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

    const theme = useTheme();
    const inputName = `outputs[${outputId}].amount`;
    const tokenInputName = `outputs[${outputId}].token`;
    const isSetMaxActive = getDefaultValue('setMaxOutputId') === outputId;
    const { symbol } = account;
    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const error = outputError ? outputError.amount : undefined;
    // corner-case: do not display "setMax" button if FormState got ANY error (setMax probably cannot be calculated)
    const isSetMaxVisible = isSetMaxActive || error || Object.keys(errors).length === 0;

    const amountValue = getDefaultValue(inputName, output.amount || '');
    const tokenValue = getDefaultValue(tokenInputName, output.token);
    const token = findToken(account.tokens, tokenValue);

    const formattedAvailableBalance = token
        ? token.balance || '0'
        : formatNetworkAmount(account.availableBalance, symbol);
    const reserve =
        account.networkType === 'ripple'
            ? formatNetworkAmount(account.misc.reserve, symbol)
            : undefined;
    const tokenBalance = token ? (
        <TokenBalanceValue>{`${token.balance} ${token.symbol!.toUpperCase()}`}</TokenBalanceValue>
    ) : undefined;
    const decimals = token ? token.decimals : network.decimals;

    return (
        <Wrapper>
            <Left>
                <StyledInput
                    state={getInputState(error, amountValue)}
                    monospace
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
                    onChange={event => {
                        if (isSetMaxActive) {
                            setValue('setMaxOutputId', undefined);
                        }

                        // calculate or reset Fiat value
                        calculateFiat(outputId, !error ? event.target.value : undefined);

                        composeTransaction(inputName);
                    }}
                    name={inputName}
                    data-test={inputName}
                    defaultValue={amountValue}
                    maxLength={MAX_LENGTH.AMOUNT}
                    innerRef={register({
                        required: 'AMOUNT_IS_NOT_SET',
                        validate: (value: string) => {
                            const amountBig = new BigNumber(value);

                            if (amountBig.isNaN()) {
                                return 'AMOUNT_IS_NOT_NUMBER';
                            }

                            if (amountBig.lt(0)) {
                                return 'AMOUNT_IS_TOO_LOW';
                            }

                            // allow 0 amount ONLY for ethereum transaction with data
                            if (amountBig.eq(0) && !getDefaultValue('ethereumDataHex')) {
                                return 'AMOUNT_IS_TOO_LOW';
                            }

                            // amounts below dust are not allowed
                            const dust =
                                feeInfo.dustLimit &&
                                formatNetworkAmount(feeInfo.dustLimit.toString(), symbol);
                            if (dust && amountBig.lte(dust)) {
                                return (
                                    <Translation
                                        key="AMOUNT_IS_BELOW_DUST"
                                        id="AMOUNT_IS_BELOW_DUST"
                                        values={{ dust: `${dust} ${symbol.toUpperCase()}` }}
                                    />
                                );
                            }

                            if (amountBig.gt(formattedAvailableBalance)) {
                                if (
                                    reserve &&
                                    amountBig.lt(formatNetworkAmount(account.balance, symbol))
                                ) {
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
                        },
                    })}
                    innerAddon={<TokenSelect output={output} outputId={outputId} />}
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
