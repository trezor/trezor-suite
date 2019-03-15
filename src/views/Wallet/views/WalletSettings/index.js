/* @flow */
import styled from 'styled-components';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import Content from 'views/Wallet/components/Content';
import {
    Switch,
    Select,
    Link,
    Button,
    Tooltip,
    Icon,
    icons as ICONS,
    colors,
} from 'trezor-ui-components';
import { FIAT_CURRENCIES } from 'config/app';
import { FONT_SIZE } from 'config/variables';
import l10nCommonMessages from 'views/common.messages';
import l10nMessages from './index.messages';
import type { Props } from './Container';

const CurrencySelect = styled(Select)`
    min-width: 77px;
    /* max-width: 200px; */
`;

const Label = styled.div`
    display: flex;
    color: ${colors.TEXT_SECONDARY};
    align-items: center;
`;

const LabelTop = styled.div`
    color: ${colors.TEXT_SECONDARY};
    padding-bottom: 10px;
`;

const Section = styled.div`
    margin-bottom: 20px;
`;

const Row = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const Actions = styled.div`
    display: flex;
    margin-top: 40px;
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

const TooltipIcon = styled(Icon)`
    cursor: pointer;
`;

const buildCurrencyOption = currency => {
    return { value: currency, label: currency.toUpperCase() };
};

const WalletSettings = (props: Props) => (
    <Content>
        <Section>
            <LabelTop>
                <FormattedMessage {...l10nMessages.TR_LOCAL_CURRENCY} />
            </LabelTop>
            <CurrencySelect
                isSearchable
                isClearable={false}
                onChange={option => props.setLocalCurrency(option.value)}
                value={buildCurrencyOption(props.wallet.localCurrency)}
                options={FIAT_CURRENCIES.map(c => buildCurrencyOption(c))}
            />
        </Section>
        <Section>
            <Row>
                <Label>
                    <FormattedMessage {...l10nCommonMessages.TR_HIDE_BALANCE} />
                    <Tooltip
                        content={<FormattedMessage {...l10nMessages.TR_HIDE_BALANCE_EXPLAINED} />}
                        maxWidth={210}
                        placement="right"
                    >
                        <TooltipIcon icon={ICONS.HELP} color={colors.TEXT_SECONDARY} size={24} />
                    </Tooltip>
                </Label>
                <Switch
                    onChange={checked => {
                        props.setHideBalance(checked);
                    }}
                    checked={props.wallet.hideBalance}
                />
            </Row>
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
