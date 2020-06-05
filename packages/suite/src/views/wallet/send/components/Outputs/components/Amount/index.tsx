import { QuestionTooltip, Translation } from '@suite-components';
import { Input, variables } from '@trezor/components';
import * as sendActions from '@wallet-actions/send/sendFormActionsNew';
import { LABEL_HEIGHT, VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { CustomFee, Output } from '@wallet-types/sendForm';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import BigNumber from 'bignumber.js';
import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import React from 'react';
import { FieldError, NestDataObject, useFormContext } from 'react-hook-form';
import styled from 'styled-components';
import validator from 'validator';

import CurrencySelect from './components/CurrencySelect';

const Wrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
    flex: 1;
`;

const Text = styled.div`
    margin-right: 3px;
`;

const StyledInput = styled(Input)`
    min-width: 250px;
    display: flex;
    flex: 1;
    margin-right: 10px;
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
    position: absolute;
    top: 0;
    right: 0;
`;

const Right = styled.div`
    display: flex;
    margin-top: ${LABEL_HEIGHT}px;
    flex: 1;
    min-width: 250px;
    align-items: flex-start;
`;

const EqualsSign = styled.div`
    display: flex;
    align-items: flex-start;
    padding: ${LABEL_HEIGHT + 15}px 20px 0;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        display: none;
    }
`;

const getMessage = (
    error: Output['amount']['error'],
    decimals: number,
    reserve: string | null,
    isLoading: Output['amount']['isLoading'],
    symbol: string,
    customFeeError: CustomFee['error'],
) => {
    if (isLoading && !error) return 'Loading'; // TODO loader or text?

    if (customFeeError) {
        return <Translation id="TR_CUSTOM_FEE_IS_NOT_VALID" />;
    }

    switch (error) {
        case VALIDATION_ERRORS.IS_EMPTY:
            return <Translation id="TR_AMOUNT_IS_NOT_SET" />;
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <Translation id="TR_AMOUNT_IS_NOT_NUMBER" />;
        case VALIDATION_ERRORS.NOT_ENOUGH:
            return <Translation id="TR_AMOUNT_IS_NOT_ENOUGH" />;
        case VALIDATION_ERRORS.XRP_CANNOT_SEND_LESS_THAN_RESERVE:
            return <Translation id="TR_XRP_CANNOT_SEND_LESS_THAN_RESERVE" values={{ reserve }} />;
        case VALIDATION_ERRORS.NOT_IN_RANGE_DECIMALS:
            return <Translation id="TR_AMOUNT_IS_NOT_IN_RANGE_DECIMALS" values={{ decimals }} />;
        case VALIDATION_ERRORS.NOT_ENOUGH_CURRENCY_FEE:
            return (
                <Translation
                    id="NOT_ENOUGH_CURRENCY_FEE"
                    values={{ symbol: symbol.toUpperCase() }}
                />
            );
        default:
            return null;
    }
};

const getMaxIcon = (setMaxActivated: boolean) => {
    return setMaxActivated ? 'CHECK' : 'SEND';
};

const getState = (error: NestDataObject<Record<string, any>, FieldError>, touched: boolean) => {
    if (touched && !error) {
        return 'success';
    }

    if (error) {
        return 'error';
    }

    return undefined;
};

export default ({ outputId }: { outputId: number }) => {
    const { account } = useSendContext();
    const { register, errors, formState, getValues, setValue } = useFormContext();
    const inputName = `amount-${outputId}`;
    const amount = getValues(inputName);
    const touched = formState.dirtyFields.has(inputName);
    // const { token } = send.networkTypeEthereum;
    const { symbol, availableBalance, networkType } = account;
    const token = null;
    const formattedAvailableBalance = token
        ? token.balance || '0'
        : formatNetworkAmount(availableBalance, symbol);
    const error = errors[inputName];
    // const { setMaxActivated, customFee } = send;
    // const { id, amount, fiatValue, localCurrency } = output;
    // const { value, error, isLoading } = amount;
    // const reserve =
    //     account.networkType === 'ripple' ? formatNetworkAmount(account.misc.reserve, symbol) : null;
    // const tokenBalance = token ? `${token.balance} ${token.symbol!.toUpperCase()}` : undefined;
    // const decimals = token ? token.decimals : network.decimals;

    return (
        <Wrapper>
            <Left>
                <StyledInput
                    state={getState(error, touched)}
                    topLabel={
                        <Label>
                            <Text>
                                <Translation id="TR_AMOUNT" />
                            </Text>
                            <QuestionTooltip messageId="TR_SEND_AMOUNT_TOOLTIP" />
                        </Label>
                    }
                    button={{
                        icon: getMaxIcon(false),
                        iconSize: 15,
                        onClick: () => {
                            if (networkType === 'ripple') {
                                const composedTransaction = sendActions.composeXrpTransaction(
                                    amount,
                                    account,
                                );
                                if (composedTransaction.type === 'final') {
                                    setValue(inputName, composedTransaction.max);
                                }
                            }
                        },
                        text: <Translation id="TR_SEND_SEND_MAX" />,
                    }}
                    align="right"
                    innerRef={register({
                        validate: {
                            TR_AMOUNT_IS_NOT_SET: (value: string) =>
                                !(touched && value.length === 0),
                            TR_AMOUNT_IS_NOT_NUMBER: (value: string) => validator.isNumeric(value),
                            TR_AMOUNT_IS_NOT_ENOUGH: (value: string) => {
                                const amountBig = new BigNumber(value);
                                return !amountBig.isGreaterThan(formattedAvailableBalance);
                            },
                        },
                    })}
                    name={inputName}
                    bottomText={error && <Translation id={error.type} />}
                />
                {/* {tokenBalance && (
                    <TokenBalance>
                        <Translation id="TR_TOKEN_BALANCE" values={{ balance: tokenBalance }} />
                    </TokenBalance>
                )} */}
                <CurrencySelect
                    symbol={symbol}
                    // tokens={account.tokens}
                    // selectedToken={send?.networkTypeEthereum.token}
                    // onChange={sendFormActions.handleTokenSelectChange}
                />
            </Left>
            {/* TODO: token FIAT rates calculation */}
            {/* {!token && ( */}
            {/* <FiatValue amount="1" fiatCurrency={localCurrency.value.value} symbol={symbol}>
                {({ rate }) =>
                    rate && (
                        <>
                            <EqualsSign>=</EqualsSign>
                            <Right>
                                <FiatComponent
                                    outputId={outputId}
                                    key="fiat-input"
                                    // state={error ? 'error' : undefined}
                                />
                            </Right>
                        </>
                    )
                }
            </FiatValue> */}
            {/* )} */}
        </Wrapper>
    );
};
