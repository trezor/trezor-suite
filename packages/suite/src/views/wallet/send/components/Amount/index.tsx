import { FiatValue, QuestionTooltip, Translation } from '@suite-components';
import { Input, variables } from '@trezor/components';
import { LABEL_HEIGHT, VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { Network } from '@wallet-types';
import { Output } from '@wallet-types/sendForm';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { getInputState } from '@wallet-utils/sendFormUtils';
import React from 'react';
import styled from 'styled-components';

import CurrencySelect from './components/CurrencySelect';
import FiatComponent from './components/Fiat';
import { Props } from './Container';

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

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        display: none;
    }
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

const getMaxIcon = (setMaxActivated: boolean) => {
    return setMaxActivated ? 'CHECK' : 'SEND';
};

export default ({ sendFormActions, output, selectedAccount, send }: Props) => {
    if (selectedAccount.status !== 'loaded' || !send) return null;

    const { account, network } = selectedAccount;
    const { symbol } = account;
    const { setMaxActivated } = send;
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
                        icon: getMaxIcon(setMaxActivated),
                        iconSize: 15,
                        onClick: () => sendFormActions.setMax(id),
                        text: <Translation id="TR_SEND_SEND_MAX" />,
                    }}
                    align="right"
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
