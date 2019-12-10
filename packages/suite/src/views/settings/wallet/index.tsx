import React from 'react';
import styled from 'styled-components';
import { WrappedComponentProps } from 'react-intl';
import { Translation } from '@suite-components/Translation';
import { Switch, Select, Tooltip, Icon, colors, variables } from '@trezor/components';
import { Button } from '@trezor/components-v2';
import messages from '@suite/support/messages';
import SettingsLayout from '@suite-components/SettingsLayout';
import { FIAT } from '@suite-config';
import Coins from './components/Coins';
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

const CloseWrapper = styled.div`
    position: relative;
    width: 100%;
    button {
        position: absolute;
        right: -24px;
        top: -30px;
    }
`;

const buildCurrencyOption = (currency: string) => {
    return {
        value: currency,
        label: currency.toUpperCase(),
    };
};

const WalletSettings = (props: Props & WrappedComponentProps) => (
    <SettingsLayout title="Settings">
        <CloseWrapper>
            <Button onClick={() => props.goto('wallet-index')} variant="tertiary" icon="CROSS" />
        </CloseWrapper>
        <Section>
            <LabelTop>
                <Translation {...messages.TR_LOCAL_CURRENCY} />
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
                    <Translation {...messages.TR_HIDE_BALANCE} />
                    <Tooltip
                        content={<Translation {...messages.TR_HIDE_BALANCE_EXPLAINED} />}
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
                changeCoinVisibility={props.changeCoinVisibility}
                toggleGroupCoinsVisibility={props.toggleGroupCoinsVisibility}
                enabledNetworks={props.wallet.settings.enabledNetworks}
            />
        </Section>
        <Actions>
            <Info>
                <Translation {...messages.TR_THE_CHANGES_ARE_SAVED} />
            </Info>
            <Buttons>
                <Button onClick={() => props.goto('wallet-index')}>
                    <Translation {...messages.TR_CLOSE} />
                </Button>
            </Buttons>
        </Actions>
    </SettingsLayout>
);

export default WalletSettings;
