import { Translation, QuestionTooltip, FiatValue } from '@suite-components';

import { Network } from '@wallet-types';
import React from 'react';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import styled from 'styled-components';
import { Output } from '@wallet-types/sendForm';
import { Input } from '@trezor/components';
import { VALIDATION_ERRORS, LABEL_HEIGHT } from '@wallet-constants/sendForm';
import { getInputState } from '@wallet-utils/sendFormUtils';

import { Props } from './Container';
import CurrencySelect from './components/CurrencySelect';
import FiatComponent from './components/Fiat';

const Wrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
    flex: 1;
`;

const Text = styled.div`
    margin-right: 3px;
`;

const StyledInput = styled(Input)`
    min-width: 150px;
`;

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const Left = styled.div`
    display: flex;
    flex: 1;
`;

const Right = styled.div`
    display: flex;
    margin-top: ${LABEL_HEIGHT}px;
    flex: 1;
    min-width: 210px;
    align-items: flex-start;
`;

const EqualsSign = styled.div`
    display: flex;
    align-items: flex-start;
    padding: ${LABEL_HEIGHT + 15}px 20px 0;
`;

const getMessage = (
    error: Output['amount']['error'],
    decimals: Network['decimals'],
    reserve: string | null,
    isLoading: Output['amount']['isLoading'],
) => {
    if (isLoading && !error) return 'Loading'; // TODO loader or text?

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
        default:
            return null;
    }
};

export default ({ sendFormActions, output, selectedAccount }: Props) => {
    if (selectedAccount.status !== 'loaded') return null;

    const { account, network } = selectedAccount;
    const { symbol } = account;
    const { decimals } = network;
    const { id, amount, fiatValue, localCurrency } = output;
    const { value, error, isLoading } = amount;
    const reserve =
        account.networkType === 'ripple' ? formatNetworkAmount(account.misc.reserve, symbol) : null;

    return (
        <Wrapper>
            <Left>
                <StyledInput
                    state={getInputState(error, value, isLoading, true)}
                    topLabel={
                        <Label>
                            <Text>
                                <Translation id="TR_AMOUNT" />
                            </Text>
                            <QuestionTooltip messageId="TR_SEND_AMOUNT_TOOLTIP" />
                        </Label>
                    }
                    button={{
                        icon: 'SEND',
                        onClick: () => sendFormActions.setMax(id),
                        text: 'Send max',
                    }}
                    align="right"
                    display="block"
                    value={value || ''}
                    onChange={e => sendFormActions.handleAmountChange(id, e.target.value)}
                    bottomText={getMessage(error, decimals, reserve, isLoading)}
                />
                <CurrencySelect key="currency-select" symbol={symbol} tokens={account.tokens} />
            </Left>
            <FiatValue amount="1" fiatCurrency={localCurrency.value.value} symbol={symbol}>
                {({ rate }) =>
                    rate && (
                        <>
                            <EqualsSign>=</EqualsSign>
                            <Right>
                                <FiatComponent
                                    outputId={id}
                                    key="fiat-input"
                                    state={error ? 'error' : undefined}
                                    sendFormActions={sendFormActions}
                                    value={fiatValue.value}
                                    localCurrency={localCurrency.value}
                                />
                            </Right>
                        </>
                    )
                }
            </FiatValue>
        </Wrapper>
    );
};
