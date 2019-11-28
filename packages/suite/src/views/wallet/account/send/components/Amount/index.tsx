import React from 'react';
import styled from 'styled-components';
import { injectIntl, WrappedComponentProps, FormattedMessage } from 'react-intl';
import { Output } from '@wallet-types/sendForm';
import { Input, variables, colors } from '@trezor/components';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import FiatComponent from './components/Fiat';
import CurrencySelect from './components/CurrencySelect';
import SetMax from './components/SetMax';

import messages from './index.messages';
import walletMessages from '@wallet-views/index.messages';
import { DispatchProps } from '../../Container';
import { Account, Fiat, Network } from '@wallet-types';

const Wrapper = styled.div`
    display: flex;
    flex: 1;

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
            return <FormattedMessage {...messages.TR_AMOUNT_IS_NOT_SET} />;
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <FormattedMessage {...messages.TR_AMOUNT_IS_NOT_NUMBER} />;
        case VALIDATION_ERRORS.NOT_ENOUGH:
            return <FormattedMessage {...messages.TR_AMOUNT_IS_NOT_ENOUGH} />;
        case VALIDATION_ERRORS.NOT_IN_RANGE_DECIMALS:
            return (
                <FormattedMessage
                    {...messages.TR_AMOUNT_IS_NOT_IN_RANGE_DECIMALS}
                    values={{ decimals }}
                />
            );
        default:
            return null;
    }
};

const getState = (error: Output['amount']['error'], amount: Output['amount']['value']) => {
    if (error) {
        return 'error';
    }
    if (amount && !error) {
        return 'success';
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

const StyledInput = styled(Input)``;

const Amount = (props: Props) => (
    <Wrapper>
        <StyledInput
            state={getState(props.error, props.amount)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            topLabel={
                <LabelWrapper>
                    <Label>
                        <FormattedMessage {...walletMessages.TR_AMOUNT} />
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
            onChange={e => props.sendFormActions.handleAmountChange(props.outputId, e.target.value)}
            bottomText={getMessage(props.error, props.decimals)}
            sideAddons={
                <>
                    <SetMax
                        key="set-max"
                        outputId={props.outputId}
                        sendFormActions={props.sendFormActions}
                        canSetMax={props.canSetMax}
                    />
                    {hasRates(props.fiat, props.localCurrency, props.symbol) && (
                        <>
                            <CurrencySelect key="currency-select" symbol={props.symbol} />
                            <FiatComponent
                                outputId={props.outputId}
                                key="fiat-input"
                                state={props.error ? 'error' : undefined}
                                sendFormActions={props.sendFormActions}
                                value={props.fiatValue}
                                localCurrency={props.localCurrency}
                            />
                        </>
                    )}
                </>
            }
        />
    </Wrapper>
);

export default injectIntl(Amount);
