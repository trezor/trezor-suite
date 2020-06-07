import { QuestionTooltip, Translation, FiatValue } from '@suite-components';
import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import { Input, variables } from '@trezor/components';
import * as sendActions from '@wallet-actions/send/sendFormActionsNew';
import { LABEL_HEIGHT } from '@wallet-constants/sendForm';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { getState } from '@wallet-utils/sendFormUtils';
import BigNumber from 'bignumber.js';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import styled from 'styled-components';
import validator from 'validator';

import CurrencySelect from './components/CurrencySelect';
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

export default ({ outputId }: { outputId: number }) => {
    const { account, setTransactionInfo, token, network } = useSendContext();
    const { register, errors, formState, getValues, setValue } = useFormContext();
    const inputName = `amount-${outputId}`;
    const amount = getValues(inputName);
    const touched = formState.dirtyFields.has(inputName);
    const { symbol, availableBalance, networkType } = account;
    const formattedAvailableBalance = token
        ? token.balance || '0'
        : formatNetworkAmount(availableBalance, symbol);
    const error = errors[inputName];
    const reserve =
        account.networkType === 'ripple' ? formatNetworkAmount(account.misc.reserve, symbol) : null;
    const tokenBalance = token ? `${token.balance} ${token.symbol!.toUpperCase()}` : undefined;
    const decimals = token ? token.decimals : network.decimals;

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
                        icon: 'SEND', // TODO CHECK
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
                                setTransactionInfo(composedTransaction);
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
                            TR_XRP_CANNOT_SEND_LESS_THAN_RESERVE: (value: string) => {
                                const amountBig = new BigNumber(value);
                                return (
                                    isDestinationAccountEmpty &&
                                    reserve &&
                                    amountBig.isLessThan(reserve)
                                );
                            },
                            // TR_AMOUNT_IS_NOT_IN_RANGE_DECIMALS: (value: string) => {},
                        },
                    })}
                    name={inputName}
                    bottomText={() => {
                        const reserveError = 'TR_XRP_CANNOT_SEND_LESS_THAN_RESERVE';
                        const currencyError = 'NOT_ENOUGH_CURRENCY_FEE';
                        const decimalError = 'TR_AMOUNT_IS_NOT_IN_RANGE_DECIMALS';
                        const { type } = error;

                        switch (type) {
                            case reserveError:
                                return <Translation id={reserveError} values={{ reserve }} />;
                            case decimalError:
                                return (
                                    <Translation
                                        id="TR_AMOUNT_IS_NOT_IN_RANGE_DECIMALS"
                                        values={{ decimals }}
                                    />
                                );
                            case currencyError:
                                return (
                                    <Translation
                                        id="NOT_ENOUGH_CURRENCY_FEE"
                                        values={{ symbol: symbol.toUpperCase() }}
                                    />
                                );

                            default:
                                return error && <Translation id={error.type} />;
                        }
                    }}
                />
                {tokenBalance && (
                    <TokenBalance>
                        <Translation id="TR_TOKEN_BALANCE" values={{ balance: tokenBalance }} />
                    </TokenBalance>
                )}
                <CurrencySelect />
            </Left>
            {/* TODO: token FIAT rates calculation */}
            {!token && (
                // <FiatValue amount="1" fiatCurrency={localCurrency.value.value} symbol={symbol}>
                <FiatValue amount="1" symbol={symbol}>
                    {({ rate }) =>
                        rate && (
                            <>
                                <EqualsSign>=</EqualsSign>
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
