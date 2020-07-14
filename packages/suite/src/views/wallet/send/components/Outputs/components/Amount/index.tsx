import React from 'react';
import BigNumber from 'bignumber.js';
import validator from 'validator';
import styled from 'styled-components';
import { Input, Icon, Button, variables } from '@trezor/components';
import { FiatValue, Translation } from '@suite-components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { toFiatCurrency } from '@wallet-utils/fiatConverterUtils';
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
    position: absolute;
    top: 0;
    right: 0;
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
        token,
        network,
        localCurrencyOption,
        destinationAddressEmpty,
        register,
        values,
        errors,
        setValue,
        composeTransaction,
        fiatRates,
    } = useSendFormContext();
    const inputName = `outputs[${outputId}].amount`;
    const isSetMaxActive = values.setMaxOutputId === outputId;
    const { symbol, availableBalance, networkType } = account;
    const formattedAvailableBalance = token
        ? token.balance || '0'
        : formatNetworkAmount(availableBalance, symbol);

    // find related fiat error
    const fiatError =
        errors.outputs && errors.outputs[outputId] ? errors.outputs[outputId].fiat : undefined;
    // find local error
    const amountError =
        errors.outputs && errors.outputs[outputId] ? errors.outputs[outputId].amount : undefined;
    // display error only if there is no related fiatError and local error is 'TR_AMOUNT_IS_NOT_SET' (empty field)
    const error =
        fiatError && amountError && amountError.message === 'TR_AMOUNT_IS_NOT_SET'
            ? undefined
            : amountError;

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
                    monospace
                    labelAddon={
                        <Button
                            icon={isSetMaxActive ? 'CHECK' : 'SEND'}
                            onClick={() => {
                                setValue('setMaxOutputId', isSetMaxActive ? -1 : outputId);
                                composeTransaction(outputId);
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
                        </Label>
                    }
                    bottomText={error && error.message}
                    onChange={event => {
                        if (isSetMaxActive) {
                            setValue('setMaxOutputId', -1);
                        }

                        if (error) {
                            if (values.outputs[outputId].fiat.length > 0) {
                                setValue(`outputs[${outputId}].fiat`, '');
                            }
                            return;
                        }

                        const selectedCurrency = values.outputs[outputId].currency;
                        const fiat =
                            fiatRates && fiatRates.current
                                ? toFiatCurrency(
                                      event.target.value,
                                      selectedCurrency.value,
                                      fiatRates.current.rates,
                                  )
                                : null;
                        if (fiat) {
                            setValue(`outputs[${outputId}].fiat`, fiat, true);
                        }

                        composeTransaction(outputId);
                    }}
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
                    innerAddon={<TokenSelect outputId={outputId} />}
                />
                {tokenBalance && (
                    <TokenBalance>
                        <Translation id="TR_TOKEN_BALANCE" values={{ balance: tokenBalance }} />
                    </TokenBalance>
                )}
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
