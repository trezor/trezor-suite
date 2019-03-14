/* @flow */
import styled from 'styled-components';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import Link from 'components/Link';
import Content from 'views/Wallet/components/Content';
import { Select } from 'components/Select';
import Button from 'components/Button';

import colors from 'config/colors';
import { FIAT_CURRENCIES } from 'config/app';
import { FONT_SIZE } from 'config/variables';
import l10nCommonMessages from 'views/common.messages';
import l10nMessages from './index.messages';
import type { Props } from './Container';

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
        {console.log(props)}
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

export default WalletSettings;
