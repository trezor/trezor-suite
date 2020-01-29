import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { Account, Fiat, Network } from '@wallet-types';
import React from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import styled from 'styled-components';
import { Output } from '@wallet-types/sendForm';
import { Input, colors, Icon } from '@trezor/components-v2';
import { VALIDATION_ERRORS, LABEL_HEIGHT } from '@wallet-constants/sendForm';
import { getInputState } from '@wallet-utils/sendFormUtils';

import { DispatchProps } from '../../Container';
import CurrencySelect from './components/CurrencySelect';
import FiatComponent from './components/Fiat';

const Wrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
    flex: 1;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
    padding-left: 5px;
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

interface Props extends WrappedComponentProps {
    outputId: Output['id'];
    fiatValue: Output['fiatValue']['value'];
    fiat: Fiat[];
    amount: Output['amount']['value'];
    symbol: Account['symbol'];
    canSetMax: boolean;
    decimals: Network['decimals'];
    localCurrency: Output['localCurrency']['value'];
    error: Output['amount']['error'];
    sendFormActions: DispatchProps['sendFormActions'];
}

const getMessage = (error: Output['amount']['error'], decimals: Network['decimals']) => {
    switch (error) {
        case VALIDATION_ERRORS.IS_EMPTY:
            return <Translation {...messages.TR_AMOUNT_IS_NOT_SET} />;
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <Translation {...messages.TR_AMOUNT_IS_NOT_NUMBER} />;
        case VALIDATION_ERRORS.NOT_ENOUGH:
            return <Translation {...messages.TR_AMOUNT_IS_NOT_ENOUGH} />;
        case VALIDATION_ERRORS.NOT_IN_RANGE_DECIMALS:
            return (
                <Translation
                    {...messages.TR_AMOUNT_IS_NOT_IN_RANGE_DECIMALS}
                    values={{ decimals }}
                />
            );
        default:
            return null;
    }
};

const hasRates = (
    fiat: any,
    localCurrency: Output['localCurrency']['value'],
    symbol: Account['symbol'],
) => {
    const fiatNetwork = fiat.find((item: any) => item.symbol === symbol);

    if (fiatNetwork) {
        const rate = fiatNetwork.rates[localCurrency.value].toString();
        if (rate) {
            return true;
        }
    }

    return false;
};

const Amount = (props: Props) => (
    <Wrapper>
        <Left>
            <StyledInput
                state={getInputState(props.error, props.amount)}
                topLabel={
                    <Label>
                        {props.intl.formatMessage(messages.TR_AMOUNT)}
                        <StyledIcon size={12} color={colors.BLACK50} icon="QUESTION" />
                    </Label>
                }
                button={{
                    icon: 'SEND',
                    onClick: () => props.sendFormActions.setMax(props.outputId),
                    text: 'Send max',
                }}
                align="right"
                display="block"
                value={props.amount || ''}
                onChange={e =>
                    props.sendFormActions.handleAmountChange(props.outputId, e.target.value)
                }
                bottomText={getMessage(props.error, props.decimals)}
            />
            <CurrencySelect key="currency-select" symbol={props.symbol} />
        </Left>
        {hasRates(props.fiat, props.localCurrency, props.symbol) && (
            <>
                <EqualsSign>=</EqualsSign>
                <Right>
                    <FiatComponent
                        outputId={props.outputId}
                        key="fiat-input"
                        state={props.error ? 'error' : undefined}
                        sendFormActions={props.sendFormActions}
                        value={props.fiatValue}
                        localCurrency={props.localCurrency}
                    />
                </Right>
            </>
        )}
    </Wrapper>
);

export default injectIntl(Amount);
