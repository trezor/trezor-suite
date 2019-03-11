/* @flow */
import styled from 'styled-components';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { FormattedMessage, injectIntl } from 'react-intl';

import * as WalletActions from 'actions/WalletActions';
import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from 'flowtype';

import Link from 'components/Link';
import Content from 'views/Wallet/components/Content';
import { Select } from 'components/Select';
import Button from 'components/Button';

import colors from 'config/colors';
import { FIAT_CURRENCIES } from 'config/app';
import { FONT_SIZE } from 'config/variables';
import l10nCommonMessages from 'views/common.messages';
import l10nMessages from './index.messages';

const CurrencySelect = styled(Select)`
    min-width: 77px;
    /* max-width: 200px; */
`;

const CurrencyLabel = styled.div`
    color: ${colors.TEXT_SECONDARY};
    padding-bottom: 10px;
`;

const Section = styled.div`
    margin-bottom: 20px;
`;

const Actions = styled.div`
    display: flex;
`;

const Buttons = styled.div`
    display: flex;
    justify-content: flex-end;
`;

const Info = styled.div`
    flex: 1;
    color: ${colors.TEXT_SECONDARY};
    font-size: ${FONT_SIZE.SMALL};
    align-self: center;
`;

const buildCurrencyOption = currency => {
    return { value: currency, label: currency.toUpperCase() };
};

const WalletSettings = (props: Props) => (
    <Content>
        <Section>
            <CurrencyLabel>
                <FormattedMessage {...l10nMessages.TR_LOCAL_CURRENCY} />
            </CurrencyLabel>
            <CurrencySelect
                isSearchable
                isClearable={false}
                onChange={option => props.setLocalCurrency(option.value)}
                value={buildCurrencyOption(props.wallet.localCurrency)}
                options={FIAT_CURRENCIES.map(c => buildCurrencyOption(c))}
            />
        </Section>
        <Actions>
            <Info>
                <FormattedMessage {...l10nMessages.TR_THE_CHANGES_ARE_SAVED} />
            </Info>
            <Buttons>
                <Link to="/">
                    <Button isGreen>
                        <FormattedMessage {...l10nCommonMessages.TR_CLOSE} />
                    </Button>
                </Link>
            </Buttons>
        </Actions>
    </Content>
);

type OwnProps = {};

type StateProps = {
    wallet: $ElementType<State, 'wallet'>,
    fiat: $ElementType<State, 'fiat'>,
    localStorage: $ElementType<State, 'localStorage'>,
};

type DispatchProps = {
    setLocalCurrency: typeof WalletActions.setLocalCurrency,
};

export type Props = StateProps & DispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (
    state: State
): StateProps => ({
    wallet: state.wallet,
    fiat: state.fiat,
    localStorage: state.localStorage,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (
    dispatch: Dispatch
): DispatchProps => ({
    setLocalCurrency: bindActionCreators(WalletActions.setLocalCurrency, dispatch),
});

export default injectIntl(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(WalletSettings)
);
