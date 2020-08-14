import React from 'react';
import BigNumber from 'bignumber.js';
import validator from 'validator';
import styled from 'styled-components';
import { Input, Icon, Button, variables, Tooltip, colors } from '@trezor/components';
import { FiatValue, Translation } from '@suite-components';
import { InputError } from '@wallet-components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { getInputState, findToken } from '@wallet-utils/sendFormUtils';
import { useSendFormContext } from '@wallet-hooks';

import TokenSelect from './components/TokenSelect';
import Fiat from './components/Fiat';

const Wrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
    flex: 1;
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
    min-width: 350px;
`;

const TokenBalance = styled.div`
    padding-right: 6px;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;

const StyledTransferIcon = styled(Icon)`
    display: flex;
    flex-direction: column;
    width: 66px;
    padding-top: 55px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.XL}) {
        display: none;
    }
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    min-width: 350px;
    align-items: flex-start;
`;

export default ({ outputId }: { outputId: number }) => {
    const {
        account,
        network,
        localCurrencyOption,
        destinationAddressEmpty,
        register,
        outputs,
        getDefaultValue,
        errors,
        setValue,
        setMax,
        calculateFiat,
        composeTransaction,
    } = useSendFormContext();

    const inputName = `outputs[${outputId}].amount`;
    const tokenInputName = `outputs[${outputId}].token`;
    const isSetMaxActive = getDefaultValue('setMaxOutputId') === outputId;
    const { symbol, availableBalance, networkType } = account;
    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const error = outputError ? outputError.amount : undefined;

    const amountValue = getDefaultValue(inputName, outputs[outputId].amount || '');
    const tokenValue = getDefaultValue(tokenInputName, outputs[outputId].token);
    const token = findToken(account.tokens, tokenValue);

    const formattedAvailableBalance = token
        ? token.balance || '0'
        : formatNetworkAmount(availableBalance, symbol);
    const reserve =
        account.networkType === 'ripple' ? formatNetworkAmount(account.misc.reserve, symbol) : null;
    const tokenBalance = token ? `${token.balance} ${token.symbol!.toUpperCase()}` : undefined;
    const decimals = token ? token.decimals : network.decimals;

    return (
        <Wrapper>
            <Left>
                <StyledInput
                    state={getInputState(error, amountValue)}
                    monospace
                    labelAddonIsVisible={isSetMaxActive}
                    labelAddon={
                        <Button
                            icon={isSetMaxActive ? 'CHECK' : 'SEND'}
                            onClick={() => {
                                setMax(outputId, isSetMaxActive);
                                composeTransaction(inputName);
                            }}
                            variant="tertiary"
                        >
                            <Translation id="TR_SEND_SEND_MAX" />
                        </Button>
                    }
                    label={
                        <Label>
                            <Text>
                                <Translation id="TR_AMOUNT" />
                            </Text>
                            {networkType === 'ripple' && (
                                <Tooltip
                                    placement="top"
                                    content={
                                        <Translation
                                            id="TR_XRP_AMOUNT_RESERVE_EXPLANATION"
                                            values={{ reserve: `${reserve} XRP` }}
                                        />
                                    }
                                >
                                    <StyledIcon size={16} color={colors.BLACK50} icon="QUESTION" />
                                </Tooltip>
                            )}
                        </Label>
                    }
                    labelRight={
                        tokenBalance ? (
                            <Label>
                                <TokenBalance>
                                    <Translation
                                        id="TR_TOKEN_BALANCE"
                                        values={{ balance: tokenBalance }}
                                    />
                                </TokenBalance>
                            </Label>
                        ) : undefined
                    }
                    bottomText={<InputError error={error} />}
                    onChange={event => {
                        if (isSetMaxActive) {
                            setValue('setMaxOutputId', undefined);
                        }

                        // calculate or reset Fiat value
                        calculateFiat(outputId, !error ? event.target.value : undefined);

                        composeTransaction(inputName, !!error);
                    }}
                    name={inputName}
                    data-test={inputName}
                    defaultValue={amountValue}
                    innerRef={register({
                        required: 'TR_AMOUNT_IS_NOT_SET',
                        validate: (value: string) => {
                            const amountBig = new BigNumber(value);

                            if (amountBig.isNaN()) {
                                return 'TR_AMOUNT_IS_NOT_NUMBER';
                            }

                            if (amountBig.lt(0)) {
                                return 'TR_AMOUNT_IS_TOO_LOW';
                            }

                            // allow 0 amount ONLY for ethereum transaction with data
                            if (amountBig.eq(0) && !getDefaultValue('ethereumDataHex')) {
                                return 'TR_AMOUNT_IS_TOO_LOW';
                            }

                            if (amountBig.isGreaterThan(formattedAvailableBalance)) {
                                return 'TR_AMOUNT_IS_NOT_ENOUGH';
                            }

                            if (
                                networkType === 'ripple' &&
                                destinationAddressEmpty &&
                                reserve &&
                                amountBig.isLessThan(reserve)
                            ) {
                                return 'TR_XRP_CANNOT_SEND_LESS_THAN_RESERVE';
                            }

                            // TODO:
                            if (
                                networkType === 'ethereum' &&
                                error &&
                                error.type === 'notEnoughCurrencyFee'
                            ) {
                                return 'NOT_ENOUGH_CURRENCY_FEE';
                            }

                            if (
                                !validator.isDecimal(value, {
                                    // eslint-disable-next-line @typescript-eslint/camelcase
                                    decimal_digits: `0,${decimals}`,
                                })
                            ) {
                                return 'TR_AMOUNT_IS_NOT_IN_RANGE_DECIMALS';
                            }
                        },
                    })}
                    innerAddon={<TokenSelect outputId={outputId} />}
                />
            </Left>
            {/* TODO: token FIAT rates calculation */}
            {!token && (
                <FiatValue amount="1" symbol={symbol} fiatCurrency={localCurrencyOption.value}>
                    {({ rate }) =>
                        rate && (
                            <>
                                <StyledTransferIcon icon="TRANSFER" />
                                <Right>
                                    <Fiat outputId={outputId} />
                                </Right>
                            </>
                        )
                    }
                </FiatValue>
            )}
        </Wrapper>
    );
};
