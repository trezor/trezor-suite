import { FiatValue, QuestionTooltip, Translation } from '@suite-components';
import { useSendContext, SendContext } from '@suite/hooks/wallet/useSendContext';
import { Input } from '@trezor/components';
import { LABEL_HEIGHT } from '@wallet-constants/sendForm';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { updateFiatInput, updateMax } from '@wallet-actions/sendFormActions';
import { getInputState } from '@wallet-utils/sendFormUtils';
import BigNumber from 'bignumber.js';
import React from 'react';
import { FieldError, NestDataObject, useFormContext } from 'react-hook-form';
import styled from 'styled-components';
import validator from 'validator';

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
    min-width: 300px;
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

    @media screen and (max-width: 1170px) {
        display: none;
    }
`;

const getError = (
    error: NestDataObject<Record<string, any>, FieldError>,
    decimals: number,
    symbol: SendContext['account']['symbol'],
    reserve: string | null,
) => {
    const reserveError = 'TR_XRP_CANNOT_SEND_LESS_THAN_RESERVE';
    const currencyError = 'NOT_ENOUGH_CURRENCY_FEE';
    const decimalError = 'TR_AMOUNT_IS_NOT_IN_RANGE_DECIMALS';
    const { type } = error;

    switch (type) {
        case reserveError:
            return <Translation id={reserveError} values={{ reserve }} />;
        case decimalError:
            return <Translation id="TR_AMOUNT_IS_NOT_IN_RANGE_DECIMALS" values={{ decimals }} />;
        case currencyError:
            return (
                <Translation
                    id="NOT_ENOUGH_CURRENCY_FEE"
                    values={{ symbol: symbol.toUpperCase() }}
                />
            );

        default:
            return <Translation id={error.type} />;
    }
};

export default ({ outputId }: { outputId: number }) => {
    const {
        account,
        setTransactionInfo,
        token,
        network,
        selectedFee,
        outputs,
        localCurrencyOption,
        setLoading,
        destinationAddressEmpty,
        fiatRates,
    } = useSendContext();
    const {
        register,
        errors,
        formState,
        getValues,
        setValue,
        setError,
        clearError,
    } = useFormContext();
    const inputName = `amount[${outputId}]`;
    const inputNameMax = `setMax[${outputId}]`;
    const isDirty = formState.dirtyFields.has(inputName);
    const { symbol, availableBalance, networkType } = account;
    const formattedAvailableBalance = token
        ? token.balance || '0'
        : formatNetworkAmount(availableBalance, symbol);
    const error = errors && errors.amount ? errors.amount[outputId] : null;
    const reserve =
        account.networkType === 'ripple' ? formatNetworkAmount(account.misc.reserve, symbol) : null;
    const tokenBalance = token ? `${token.balance} ${token.symbol!.toUpperCase()}` : undefined;
    const decimals = token ? token.decimals : network.decimals;

    return (
        <Wrapper>
            <input type="hidden" name={inputNameMax} ref={register} />
            <Left>
                <StyledInput
                    state={getInputState(error, isDirty)}
                    topLabel={
                        <Label>
                            <Text>
                                <Translation id="TR_AMOUNT" />
                            </Text>
                            <QuestionTooltip messageId="TR_SEND_AMOUNT_TOOLTIP" />
                        </Label>
                    }
                    onChange={async () => {
                        updateFiatInput(outputId, fiatRates, getValues, setValue);
                        setValue(`setMax[${outputId}]`, 'inactive');
                    }}
                    button={{
                        icon: getValues(inputNameMax) === 'active' ? 'CHECK' : 'SEND',
                        iconSize: 16,
                        onClick: async () => {
                            if (networkType === 'bitcoin') {
                                setLoading(true);
                            }
                            await updateMax(
                                outputId,
                                account,
                                setValue,
                                getValues,
                                clearError,
                                setError,
                                selectedFee,
                                outputs,
                                token,
                                fiatRates,
                                setTransactionInfo,
                            );

                            if (networkType === 'bitcoin') {
                                setLoading(false);
                            }
                        },
                        text: <Translation id="TR_SEND_SEND_MAX" />,
                    }}
                    align="right"
                    innerRef={register({
                        validate: {
                            TR_AMOUNT_IS_NOT_SET: (value: string) => {
                                return !(value.length === 0);
                            },
                            TR_AMOUNT_IS_NOT_NUMBER: (value: string) => {
                                const amountBig = new BigNumber(value);
                                return validator.isNumeric(value) && amountBig.isGreaterThan(0);
                            },
                            TR_AMOUNT_IS_NOT_ENOUGH: (value: string) => {
                                const amountBig = new BigNumber(value);
                                return !amountBig.isGreaterThan(formattedAvailableBalance);
                            },
                            TR_XRP_CANNOT_SEND_LESS_THAN_RESERVE: (value: string) => {
                                if (networkType === 'ripple' && reserve) {
                                    const amountBig = new BigNumber(value);
                                    return !(
                                        destinationAddressEmpty &&
                                        reserve &&
                                        amountBig.isLessThan(reserve)
                                    );
                                }
                            },
                            TR_AMOUNT_IS_NOT_IN_RANGE_DECIMALS: (value: string) => {
                                return validator.isDecimal(value, {
                                    // eslint-disable-next-line @typescript-eslint/camelcase
                                    decimal_digits: `0,${decimals}`,
                                });
                            },
                        },
                    })}
                    name={inputName}
                    bottomText={error && getError(error, decimals, symbol, reserve)}
                />
                {tokenBalance && (
                    <TokenBalance>
                        <Translation id="TR_TOKEN_BALANCE" values={{ balance: tokenBalance }} />
                    </TokenBalance>
                )}
                <TokenSelect outputId={outputId} />
            </Left>
            {/* TODO: token FIAT rates calculation */}
            {!token && (
                <FiatValue amount="1" symbol={symbol} fiatCurrency={localCurrencyOption.value}>
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
