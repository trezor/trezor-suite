/* @flow */

import React from 'react';
import styled, { css } from 'styled-components';
import { Select } from 'components/Select';
import Button from 'components/Button';
import Input from 'components/inputs/Input';
import Icon from 'components/Icon';
import ICONS from 'config/icons';
import { FONT_SIZE, FONT_WEIGHT, TRANSITION } from 'config/variables';
import colors from 'config/colors';
import { H2 } from 'components/Heading';
import Content from 'views/Wallet/components/Content';
import PendingTransactions from '../components/PendingTransactions';

import type { Props } from './Container';

// TODO: Decide on a small screen width for the whole app
// and put it inside config/variables.js
const SmallScreenWidth = '850px';

const InputRow = styled.div`
    margin: 20px 0;
`;

const SetMaxAmountButton = styled(Button)`
    height: 40px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    justify-content: center;

    font-size: ${FONT_SIZE.SMALLER};
    font-weight: ${FONT_WEIGHT.SMALLEST};
    color: ${colors.TEXT_SECONDARY};

    border-radius: 0;
    border: 1px solid ${colors.DIVIDER};
    border-right: 0;
    border-left: 0;
    background: transparent;
    transition: ${TRANSITION.HOVER};

    &:hover {
        background: ${colors.GRAY_LIGHT};
    }

    ${props => props.isActive && css`
        color: ${colors.WHITE};
        background: ${colors.GREEN_PRIMARY};
        border-color: ${colors.GREEN_PRIMARY};

        &:hover {
            background: ${colors.GREEN_SECONDARY};
        }

        &:active {
            background: ${colors.GREEN_TERTIARY};
        }
    `}
`;

const CurrencySelect = styled(Select)`
    min-width: 77px;
    height: 40px;
    flex: 0.2;
`;

const ToggleAdvancedSettingsWrapper = styled.div`
    min-height: 40px;
    margin-bottom: 20px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    @media screen and (max-width: ${SmallScreenWidth}) {
        ${props => (props.isAdvancedSettingsHidden && css`
            flex-direction: column;
        `)}
    }
`;

const SendButton = styled(Button)`
    min-width: ${props => (props.isAdvancedSettingsHidden ? '50%' : '100%')};
    font-size: 13px;

    @media screen and (max-width: ${SmallScreenWidth}) {
        margin-top: ${props => (props.isAdvancedSettingsHidden ? '10px' : 0)};
    }
`;

// render helpers
const getAddressInputState = (address: string, addressErrors: string, addressWarnings: string): string => {
    let state = '';
    if (address && !addressErrors) {
        state = 'success';
    }
    if (addressWarnings && !addressErrors) {
        state = 'warning';
    }
    if (addressErrors) {
        state = 'error';
    }
    return state;
};

const getAmountInputState = (amountErrors: string, amountWarnings: string): string => {
    let state = '';
    if (amountWarnings && !amountErrors) {
        state = 'warning';
    }
    if (amountErrors) {
        state = 'error';
    }
    return state;
};

// stateless component
const AccountSend = (props: Props) => {
    const device = props.wallet.selectedDevice;
    const {
        account,
        network,
        discovery,
        shouldRender,
        loader,
    } = props.selectedAccount;
    const {
        address,
        amount,
        setMax,
        total,
        errors,
        warnings,
        infos,
        sending,
        advanced,
    } = props.sendForm;

    const {
        onAddressChange,
        onAmountChange,
        onSetMax,
        onSend,
    } = props.sendFormActions;
    const { type, title, message } = loader;
    if (!device || !account || !discovery || !network || !shouldRender) return <Content type={type} title={title} message={message} isLoading />;

    let isSendButtonDisabled: boolean = Object.keys(errors).length > 0 || total === '0' || amount.length === 0 || address.length === 0 || sending;
    let sendButtonText: string = ` ${total} ${network.symbol}`;

    if (!device.connected) {
        sendButtonText = 'Device is not connected';
        isSendButtonDisabled = true;
    } else if (!device.available) {
        sendButtonText = 'Device is unavailable';
        isSendButtonDisabled = true;
    } else if (!discovery.completed) {
        sendButtonText = 'Loading accounts';
        isSendButtonDisabled = true;
    }

    const tokensSelectData: Array<{ value: string, label: string }> = [{ value: network.symbol, label: network.symbol }];
    const tokensSelectValue = tokensSelectData[0];
    const isAdvancedSettingsHidden = !advanced;

    return (
        <Content>
            <React.Fragment>
                <H2>Send Ripple</H2>
                <InputRow>
                    <Input
                        state={getAddressInputState(address, errors.address, warnings.address)}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        topLabel="Address"
                        bottomText={errors.address || warnings.address || infos.address}
                        value={address}
                        onChange={event => onAddressChange(event.target.value)}
                    />
                </InputRow>

                <InputRow>
                    <Input
                        state={getAmountInputState(errors.amount, warnings.amount)}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        value={amount}
                        onChange={event => onAmountChange(event.target.value)}
                        bottomText={errors.amount || warnings.amount || infos.amount}
                        sideAddons={[
                            (
                                <SetMaxAmountButton
                                    key="icon"
                                    onClick={() => onSetMax()}
                                    isActive={setMax}
                                >
                                    {!setMax && (
                                        <Icon
                                            icon={ICONS.TOP}
                                            size={25}
                                            color={colors.TEXT_SECONDARY}
                                        />
                                    )}
                                    {setMax && (
                                        <Icon
                                            icon={ICONS.CHECKED}
                                            size={25}
                                            color={colors.WHITE}
                                        />
                                    )}
                                Set max
                                </SetMaxAmountButton>
                            ),
                            (
                                <CurrencySelect
                                    key="currency"
                                    isSearchable={false}
                                    isClearable={false}
                                    value={tokensSelectValue}
                                    isDisabled
                                    options={tokensSelectData}
                                />
                            ),
                        ]}
                    />
                </InputRow>

                <ToggleAdvancedSettingsWrapper
                    isAdvancedSettingsHidden={isAdvancedSettingsHidden}
                >
                    <SendButton
                        isDisabled={isSendButtonDisabled}
                        isAdvancedSettingsHidden={isAdvancedSettingsHidden}
                        onClick={() => onSend()}
                    >
                        {sendButtonText}
                    </SendButton>
                </ToggleAdvancedSettingsWrapper>


                {props.selectedAccount.pending.length > 0 && (
                    <PendingTransactions
                        pending={props.selectedAccount.pending}
                        tokens={props.selectedAccount.tokens}
                        network={network}
                    />
                )}
            </React.Fragment>
        </Content>
    );
};

export default AccountSend;
