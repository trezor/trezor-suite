import React from 'react';
import styled from 'styled-components';
import { injectIntl, InjectedIntl, FormattedMessage } from 'react-intl';
import { State } from '@wallet-reducers/sendFormReducer';
import { Input, variables, colors } from '@trezor/components';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';

import Fiat from './components/Fiat';
import CurrencySelect from './components/CurrencySelect';
import SetMax from './components/SetMax';

import messages from './index.messages';
import { DispatchProps } from '../../Container';
import { Account } from '@wallet-types';

const Wrapper = styled.div`
    display: flex;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex-wrap: wrap;
    }
`;

const LabelWrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

const Label = styled.span`
    text-align: right;
    color: ${colors.TEXT_SECONDARY};
`;

interface Props {
    intl: InjectedIntl;
    fiatValue: State['fiatValue'];
    amount: State['amount'];
    symbol: Account['symbol'];
    canSetMax: boolean;
    localCurrency: State['localCurrency'];
    error: State['errors']['amount'];
    sendFormActions: DispatchProps['sendFormActions'];
}

const getErrorMessage = (error: State['errors']['amount']) => {
    switch (error) {
        case VALIDATION_ERRORS.IS_EMPTY:
            return <FormattedMessage {...messages.TR_AMOUNT_IS_NOT_SET} />;
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <FormattedMessage {...messages.TR_AMOUNT_IS_NOT_NUMBER} />;
        case VALIDATION_ERRORS.NOT_ENOUGH:
            return <FormattedMessage {...messages.TR_AMOUNT_IS_NOT_ENOUGH} />;
        default:
            return null;
    }
};

const getState = (error: State['errors']['amount'], amount: State['address']) => {
    if (error) {
        return 'error';
    }
    if (amount && !error) {
        return 'success';
    }
};

const Amount = (props: Props) => (
    <Wrapper>
        <Input
            state={getState(props.error, props.amount)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            topLabel={
                <LabelWrapper>
                    <Label>
                        <FormattedMessage {...messages.TR_AMOUNT} />
                    </Label>
                    {true && (
                        <Label>
                            {/* <FormattedMessage
                                {...accountMessages.TR_XRP_RESERVE}
                                values={{ value: '`${accountReserve} ${network.symbol}`' }}
                            /> */}
                        </Label>
                    )}
                </LabelWrapper>
            }
            value={props.amount || ''}
            onChange={e => props.sendFormActions.handleAmountChange(e.target.value)}
            bottomText={getErrorMessage(props.error)}
            sideAddons={[
                <SetMax sendFormActions={props.sendFormActions} canSetMax={props.canSetMax} />,
                <CurrencySelect symbol={props.symbol} />,
                <Fiat
                    state={props.error ? 'error' : undefined}
                    sendFormActions={props.sendFormActions}
                    value={props.fiatValue}
                    localCurrency={props.localCurrency}
                />,
            ]}
        />
    </Wrapper>
);

export default injectIntl(Amount);
