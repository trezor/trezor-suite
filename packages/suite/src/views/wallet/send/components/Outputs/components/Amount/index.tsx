import React from 'react';
import BigNumber from 'bignumber.js';
import validator from 'validator';
import styled from 'styled-components';
import { Input, Icon } from '@trezor/components';
import { FiatValue, Translation } from '@suite-components';
import { LABEL_HEIGHT } from '@wallet-constants/sendForm';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
// import { updateFiatInput, updateMax } from '@wallet-actions/sendFormActions';
import { getInputState } from '@wallet-utils/sendFormUtils';
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

const StyledTranserIcon = styled(Icon)`
    display: flex;
    flex-direction: column;

    margin: ${LABEL_HEIGHT + 12}px 22px 0 22px;
`;

const Right = styled.div`
    display: flex;
    margin-top: ${LABEL_HEIGHT}px;
    flex: 1;
    min-width: 250px;
    align-items: flex-start;
`;

export default ({ outputId }: { outputId: number }) => {
    const {
        account,
        token,
        network,
        localCurrencyOption,
        destinationAddressEmpty,
        register,
        values,
        errors,
        setValue,
        composeTransaction,
    } = useSendFormContext();
    const inputName = `outputs[${outputId}].amount`;
    const isSetMaxActive = values.setMaxOutputId === outputId;
    const { symbol, availableBalance, networkType } = account;
    const formattedAvailableBalance = token
        ? token.balance || '0'
        : formatNetworkAmount(availableBalance, symbol);
    const error =
        errors.outputs && errors.outputs[outputId] ? errors.outputs[outputId].amount : undefined;
    const reserve =
        account.networkType === 'ripple' ? formatNetworkAmount(account.misc.reserve, symbol) : null;
    const tokenBalance = token ? `${token.balance} ${token.symbol!.toUpperCase()}` : undefined;
    const decimals = token ? token.decimals : network.decimals;
    const amountValue =
        values.outputs && values.outputs[outputId] ? values.outputs[outputId].amount : '';

    return (
        <Wrapper>
            <Left>
                <StyledInput
                    state={getInputState(error, amountValue)}
                    topLabel={
                        <Label>
                            <Text>
                                <Translation id="TR_AMOUNT" />
                            </Text>
                        </Label>
                    }
                    onChange={() => {
                        if (isSetMaxActive) {
                            setValue('setMaxOutputId', -1);
                        }
                        if (error) return;
                        // updateFiatInput(outputId, fiatRates, getValues, setValue);
                        composeTransaction(outputId);
                    }}
                    button={{
                        icon: isSetMaxActive ? 'CHECK' : 'SEND',
                        iconSize: 16,
                        onClick: () => {
                            setValue('setMaxOutputId', isSetMaxActive ? -1 : outputId);
                            composeTransaction(outputId);
                        },
                        text: <Translation id="TR_SEND_SEND_MAX" />,
                    }}
                    align="right"
                    name={inputName}
                    defaultValue={amountValue}
                    innerRef={register({
                        required: 'TR_AMOUNT_IS_NOT_SET',
                        validate: (value: string) => {
                            const amountBig = new BigNumber(value);
                            if (amountBig.isNaN()) {
                                return 'TR_AMOUNT_IS_NOT_NUMBER';
                            }

                            if (amountBig.lte(0)) {
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
                    bottomText={error && error.message}
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
                                <StyledTranserIcon icon="TRANSFER" />
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
