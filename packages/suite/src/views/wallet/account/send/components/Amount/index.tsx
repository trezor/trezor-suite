import React from 'react';
import styled from 'styled-components';
import { injectIntl, InjectedIntl, FormattedMessage } from 'react-intl';
import { State } from '@wallet-reducers/sendFormReducer';
import { Input, variables, colors, Icon, Button, Select } from '@trezor/components';
import LocalCurrency from './components/LocalCurrency';
import messages from './index.messages';
import { DispatchProps } from '../../Container';

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

const SetMaxAmountButton = styled(Button)`
    padding: 0 10px;
    font-size: ${variables.FONT_SIZE.SMALL};
    transition: all 0s;
    border-radius: 0;
    border-right: 0;
    border-left: 0;
`;

const CurrencySelect = styled(Select)`
    min-width: 77px;
    height: 40px;
    flex: 0.2;
`;

const StyledIcon = styled(Icon)`
    padding: 0 5px 0 0;
`;

interface Props {
    intl: InjectedIntl;
    fiatValue: State['fiatValue'];
    value: State['amount'];
    localCurrency: State['localCurrency'];
    error: State['errors']['amount'];
    sendFormActions: DispatchProps['sendFormActions'];
}

const setMax = false;

const getErrorMessage = (error: State['errors']['amount']) => {
    switch (error) {
        case 'empty':
            return <FormattedMessage {...messages.TR_AMOUNT_IS_NOT_SET} />;
        case 'is-not-number':
            return <FormattedMessage {...messages.TR_AMOUNT_IS_NOT_NUMBER} />;
        default:
            return null;
    }
};

const Amount = (props: Props) => (
    <Wrapper>
        <Input
            state={props.error ? 'error' : undefined}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
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
            value={props.value || ''}
            onChange={e => props.sendFormActions.handleAmountChange(e.target.value)}
            bottomText={getErrorMessage(props.error)}
            sideAddons={[
                <SetMaxAmountButton key="icon" onClick={() => {}} isWhite={false}>
                    {!setMax && <StyledIcon icon="TOP" size={14} color={colors.TEXT_SECONDARY} />}
                    {setMax && <StyledIcon icon="SUCCESS" size={14} color={colors.WHITE} />}
                    <FormattedMessage {...messages.TR_SET_MAX} />
                </SetMaxAmountButton>,
                <CurrencySelect
                    key="currency"
                    isSearchable={false}
                    isClearable={false}
                    value={props.value}
                    isDisabled
                    options={null}
                />,
                <LocalCurrency
                    state={props.error ? 'error' : undefined}
                    sendFormActions={props.sendFormActions}
                    fiatValue={props.fiatValue}
                    localCurrency={props.localCurrency}
                />,
            ]}
        />
    </Wrapper>
);

export default injectIntl(Amount);
