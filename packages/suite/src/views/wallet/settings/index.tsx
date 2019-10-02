import React from 'react';
import styled from 'styled-components';
import { FormattedMessage, InjectedIntlProps } from 'react-intl';
import { Switch, Select, Button, Tooltip, Icon, colors, variables } from '@trezor/components';
import Link from '@suite-components/Link';
import l10nCommonMessages from '@suite-views/index.messages';
import WalletLayout from '@wallet-components/WalletLayout';
import { getRoute } from '@suite/utils/suite/router';
import { FIAT } from '@suite-config';
import { NETWORKS } from '@wallet-config';
import Coins from './components/Coins';
import l10nMessages from './index.messages';
import { Props } from './Container';

const { FONT_SIZE } = variables;

const CurrencySelect = styled(Select)`
    min-width: 77px;
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
    margin-left: 6px;
    cursor: pointer;
`;

const buildCurrencyOption = (currency: string) => {
    return {
        value: currency,
        label: currency.toUpperCase(),
    };
};

const WalletSettings = (props: Props & InjectedIntlProps) => (
    <WalletLayout>
        <Section>
            <LabelTop>
                <FormattedMessage {...l10nMessages.TR_LOCAL_CURRENCY} />
            </LabelTop>
            <CurrencySelect
                isSearchable
                isClearable={false}
                onChange={(option: { value: string; label: string }) =>
                    props.setLocalCurrency(option.value)
                }
                value={buildCurrencyOption(props.wallet.settings.localCurrency)}
                options={FIAT.currencies.map(c => buildCurrencyOption(c))}
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
                        <TooltipIcon icon="HELP" color={colors.TEXT_SECONDARY} size={12} />
                    </Tooltip>
                </Label>
                <Switch
                    isSmall
                    checkedIcon={false}
                    uncheckedIcon={false}
                    onChange={checked => {
                        props.setHideBalance(checked);
                    }}
                    checked={props.wallet.settings.hideBalance}
                />
            </Row>
        </Section>
        <Section>
            <Coins
                networks={NETWORKS}
                changeCoinVisibility={props.changeCoinVisibility}
                toggleGroupCoinsVisibility={props.toggleGroupCoinsVisibility}
                enabledNetworks={props.wallet.settings.enabledNetworks}
                externalNetworks={props.wallet.settings.enabledExternalNetworks}
            />
        </Section>
        <Actions>
            <Info>
                <FormattedMessage {...l10nMessages.TR_THE_CHANGES_ARE_SAVED} />
            </Info>
            <Buttons>
                <Link href={getRoute('wallet-index')}>
                    <Button>
                        <FormattedMessage {...l10nCommonMessages.TR_CLOSE} />
                    </Button>
                </Link>
            </Buttons>
        </Actions>
    </WalletLayout>
);

export default WalletSettings;
