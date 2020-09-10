import React from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { Input, Icon, Button, variables, colors } from '@trezor/components';
import { FiatValue, Translation } from '@suite-components';
import { InputError } from '@wallet-components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { getInputState, findToken } from '@wallet-utils/sendFormUtils';
import { isDecimalsValid } from '@wallet-utils/validation';
import { useSendFormContext } from '@wallet-hooks';
import { MAX_LENGTH } from '@suite-constants/inputs';

import TokenSelect from './components/TokenSelect';
import Fiat from './components/Fiat';

const Wrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
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
    min-width: 260px;
`;

const TokenBalance = styled.div`
    padding-right: 6px;
`;

const StyledTransferIcon = styled(Icon)`
    @media all and (max-width: ${variables.SCREEN_SIZE.LG}) {
        transform: rotate(90deg);
    }
`;
const TransferIconWrapper = styled.div`
    margin: 45px 10px 0px 10px;

    @media all and (max-width: ${variables.SCREEN_SIZE.LG}) {
        /* transform: rotate(90deg); */
        margin: 0px;
    }
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    min-width: 260px;
    align-items: flex-start;
`;

export default ({ outputId }: { outputId: number }) => {
    const {
        account,
        network,
        localCurrencyOption,
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
    const { symbol } = account;
    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const error = outputError ? outputError.amount : undefined;

    const amountValue = getDefaultValue(inputName, outputs[outputId].amount || '');
    const tokenValue = getDefaultValue(tokenInputName, outputs[outputId].token);
    const token = findToken(account.tokens, tokenValue);

    const formattedAvailableBalance = token
        ? token.balance || '0'
        : formatNetworkAmount(account.availableBalance, symbol);
    const reserve =
        account.networkType === 'ripple'
            ? formatNetworkAmount(account.misc.reserve, symbol)
            : undefined;
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
                            <Translation id="AMOUNT_SEND_MAX" />
                        </Button>
                    }
                    label={
                        <Label>
                            <Text>
                                <Translation id="AMOUNT" />
                            </Text>
                        </Label>
                    }
                    labelRight={
                        tokenBalance ? (
                            <Label>
                                <TokenBalance>
                                    <Translation
                                        id="TOKEN_BALANCE"
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
                    innerAddon={<TokenSelect outputId={outputId} />}
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
                                        color={colors.NEUE_TYPE_LIGHT_GREY}
                                    />
                                </TransferIconWrapper>
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
