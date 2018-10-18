/* @flow */

import React from 'react';
import styled, { css } from 'styled-components';
import { Select } from 'components/Select';
import Button from 'components/Button';
import Input from 'components/inputs/Input';
import Icon from 'components/Icon';
import Link from 'components/Link';
import ICONS from 'config/icons';
import { FONT_SIZE, FONT_WEIGHT, TRANSITION } from 'config/variables';
import colors from 'config/colors';
import P from 'components/Paragraph';
import { H2 } from 'components/Heading';
import Content from 'views/Wallet/components/Content';
import type { Token } from 'flowtype';
import AdvancedForm from './components/AdvancedForm';
import PendingTransactions from './components/PendingTransactions';

import type { Props } from './Container';

// TODO: Decide on a small screen width for the whole app
// and put it inside config/variables.js
const SmallScreenWidth = '850px';

const AmountInputLabelWrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

const AmountInputLabel = styled.span`
    text-align: right;
    color: ${colors.TEXT_SECONDARY};
`;

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

const FeeOptionWrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

const FeeLabelWrapper = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 4px;
`;

const FeeLabel = styled.span`
    color: ${colors.TEXT_SECONDARY};
`;

const UpdateFeeWrapper = styled.span`
    margin-left: 8px;
    display: flex;
    align-items: center;
    font-size: ${FONT_SIZE.SMALLER};
    color: ${colors.WARNING_PRIMARY};
`;

const StyledLink = styled(Link)`
    margin-left: 4px;
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

const ToggleAdvancedSettingsButton = styled(Button)`
    min-height: 40px;
    padding: 0;
    display: flex;
    align-items: center;
    font-weight: ${FONT_WEIGHT.BIGGER};
`;

const SendButton = styled(Button)`
    min-width: ${props => (props.isAdvancedSettingsHidden ? '50%' : '100%')};
    font-size: 13px;

    @media screen and (max-width: ${SmallScreenWidth}) {
        margin-top: ${props => (props.isAdvancedSettingsHidden ? '10px' : 0)};
    }
`;

const AdvancedSettingsIcon = styled(Icon)`
    margin-left: 10px;
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

const getTokensSelectData = (tokens: Array<Token>, accountNetwork: any): Array<{ value: string, label: string }> => {
    const tokensSelectData: Array<{ value: string, label: string }> = tokens.map(t => ({ value: t.symbol, label: t.symbol }));
    tokensSelectData.unshift({ value: accountNetwork.symbol, label: accountNetwork.symbol });

    return tokensSelectData;
};

// stateless component
const AccountSend = (props: Props) => {
    const device = props.wallet.selectedDevice;
    const {
        account,
        network,
        discovery,
        tokens,
        shouldRender,
    } = props.selectedAccount;
    const {
        address,
        amount,
        setMax,
        networkSymbol,
        currency,
        feeLevels,
        selectedFeeLevel,
        gasPriceNeedsUpdate,
        total,
        errors,
        warnings,
        infos,
        sending,
        advanced,
    } = props.sendForm;

    const {
        toggleAdvanced,
        onAddressChange,
        onAmountChange,
        onSetMax,
        onCurrencyChange,
        onFeeLevelChange,
        updateFeeLevels,
        onSend,
    } = props.sendFormActions;

    if (!device || !account || !discovery || !network || !shouldRender) return null;

    const isCurrentCurrencyToken = networkSymbol !== currency;

    let selectedTokenBalance = 0;
    const selectedToken = tokens.find(t => t.symbol === currency);
    if (selectedToken) {
        selectedTokenBalance = selectedToken.balance;
    }

    let isSendButtonDisabled: boolean = Object.keys(errors).length > 0 || total === '0' || amount.length === 0 || address.length === 0 || sending;
    let sendButtonText: string = 'Send';
    if (networkSymbol !== currency && amount.length > 0 && !errors.amount) {
        sendButtonText += ` ${amount} ${currency.toUpperCase()}`;
    } else if (networkSymbol === currency && total !== '0') {
        sendButtonText += ` ${total} ${network.symbol}`;
    }

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

    const tokensSelectData = getTokensSelectData(tokens, network);
    const tokensSelectValue = tokensSelectData.find(t => t.value === currency)
    const isAdvancedSettingsHidden = !advanced;

    return (
        <Content>
            <React.Fragment>
                <H2>Send Ethereum or tokens</H2>
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
                        topLabel={(
                            <AmountInputLabelWrapper>
                                <AmountInputLabel>Amount</AmountInputLabel>
                                {(isCurrentCurrencyToken && selectedToken) && (
                                    <AmountInputLabel>You have: {selectedTokenBalance} {selectedToken.symbol}</AmountInputLabel>
                                )}
                            </AmountInputLabelWrapper>
                        )}
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
                                    isDisabled={tokensSelectData.length < 2}
                                    onChange={onCurrencyChange}
                                    options={tokensSelectData}
                                />
                            ),
                        ]}
                    />
                </InputRow>

                <InputRow>
                    <FeeLabelWrapper>
                        <FeeLabel>Fee</FeeLabel>
                        {gasPriceNeedsUpdate && (
                            <UpdateFeeWrapper>
                                <Icon
                                    icon={ICONS.WARNING}
                                    color={colors.WARNING_PRIMARY}
                                    size={20}
                                />
                            Recommended fees updated. <StyledLink onClick={updateFeeLevels} isGreen>Click here to use them</StyledLink>
                            </UpdateFeeWrapper>
                        )}
                    </FeeLabelWrapper>
                    <Select
                        isSearchable={false}
                        isClearable={false}
                        value={selectedFeeLevel}
                        onChange={onFeeLevelChange}
                        options={feeLevels}
                        formatOptionLabel={option => (
                            <FeeOptionWrapper>
                                <P>{option.value}</P>
                                <P>{option.label}</P>
                            </FeeOptionWrapper>
                        )}
                    />
                </InputRow>

                <ToggleAdvancedSettingsWrapper
                    isAdvancedSettingsHidden={isAdvancedSettingsHidden}
                >
                    <ToggleAdvancedSettingsButton
                        isTransparent
                        onClick={toggleAdvanced}
                    >
                    Advanced settings
                        <AdvancedSettingsIcon
                            icon={ICONS.ARROW_DOWN}
                            color={colors.TEXT_SECONDARY}
                            size={24}
                            isActive={advanced}
                            canAnimate
                        />
                    </ToggleAdvancedSettingsButton>

                    {isAdvancedSettingsHidden && (
                        <SendButton
                            isDisabled={isSendButtonDisabled}
                            isAdvancedSettingsHidden={isAdvancedSettingsHidden}
                            onClick={() => onSend()}
                        >
                            {sendButtonText}
                        </SendButton>
                    )}
                </ToggleAdvancedSettingsWrapper>

                {advanced && (
                    <AdvancedForm {...props}>
                        <SendButton
                            isDisabled={isSendButtonDisabled}
                            onClick={() => onSend()}
                        >
                            {sendButtonText}
                        </SendButton>
                    </AdvancedForm>
                )}

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
