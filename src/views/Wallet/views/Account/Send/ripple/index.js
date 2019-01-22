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
import Title from 'views/Wallet/components/Title';
import P from 'components/Paragraph';
import Content from 'views/Wallet/components/Content';
import PendingTransactions from '../components/PendingTransactions';
import AdvancedForm from './components/AdvancedForm';

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
    padding-bottom: 28px;
`;

const SetMaxAmountButton = styled(Button)`
    height: 40px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    justify-content: center;

    font-size: ${FONT_SIZE.SMALL};
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

const OptionValue = styled(P)`
    flex: 1 0 auto;
    min-width: 70px;
    margin-right: 5px;
`;

const OptionLabel = styled(P)`
    flex: 0 1 auto;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: right;
    word-break: break-all;
`;

const FeeLabelWrapper = styled.div`
    display: flex;
    align-items: center;
    padding-bottom: 10px;
`;

const FeeLabel = styled.span`
    color: ${colors.TEXT_SECONDARY};
`;

const UpdateFeeWrapper = styled.span`
    margin-left: 8px;
    display: flex;
    align-items: center;
    font-size: ${FONT_SIZE.SMALL};
    color: ${colors.WARNING_PRIMARY};
`;

const StyledLink = styled(Link)`
    margin-left: 4px;
    white-space: nowrap;
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
    flex: 1 1 0;
    align-items: center;
    font-weight: ${FONT_WEIGHT.SEMIBOLD};
`;

const FormButtons = styled.div`
    display: flex;
    flex: 1 1;

    
    @media screen and (max-width: ${SmallScreenWidth}) {
        margin-top: ${props => (props.isAdvancedSettingsHidden ? '10px' : 0)};
    }

    Button + Button {
        margin-left: 5px;
    }
`;

const SendButton = styled(Button)`
    word-break: break-all;
    flex: 1;

`;

const ClearButton = styled(Button)`

`;

const AdvancedSettingsIcon = styled(Icon)`
    margin-left: 10px;
`;

const QrButton = styled(Button)`
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
    border-left: 0px;
    height: 40px;
    padding: 0 10px;
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
    } = props.selectedAccount;
    const {
        address,
        amount,
        setMax,
        feeLevels,
        selectedFeeLevel,
        feeNeedsUpdate,
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
        onFeeLevelChange,
        updateFeeLevels,
        onSend,
        onClear,
    } = props.sendFormActions;

    if (!device || !account || !discovery || !network || !shouldRender) {
        const { loader, exceptionPage } = props.selectedAccount;
        return <Content loader={loader} exceptionPage={exceptionPage} isLoading />;
    }

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
    const accountReserve: ?string = account.networkType === 'ripple' && !account.empty ? account.reserve : null;

    return (
        <Content>
            <Title>Send Ripple</Title>
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
                    sideAddons={[(
                        <QrButton
                            key="qrButton"
                            isWhite
                            onClick={props.openQrModal}
                        >
                            <Icon
                                size={25}
                                color={colors.TEXT_SECONDARY}
                                icon={ICONS.QRCODE}
                            />
                        </QrButton>
                    )]}
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
                            {accountReserve && (
                                <AmountInputLabel>Reserve: {accountReserve} {network.symbol}</AmountInputLabel>
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
                                isDisabled
                                options={tokensSelectData}
                            />
                        ),
                    ]}
                />
            </InputRow>

            <InputRow>
                <FeeLabelWrapper>
                    <FeeLabel>Fee</FeeLabel>
                    {feeNeedsUpdate && (
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
                            <OptionValue>{option.value}</OptionValue>
                            <OptionLabel>{option.label}</OptionLabel>
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
                    <FormButtons
                        isAdvancedSettingsHidden={isAdvancedSettingsHidden}
                    >
                        <ClearButton
                            isWhite
                            onClick={() => onClear()}
                        >
                            Clear
                        </ClearButton>
                        <SendButton
                            isDisabled={isSendButtonDisabled}
                            onClick={() => onSend()}
                        >
                            {sendButtonText}
                        </SendButton>
                    </FormButtons>
                )}
            </ToggleAdvancedSettingsWrapper>

            {advanced && (
                <AdvancedForm {...props}>
                    <FormButtons
                        isAdvancedSettingsHidden={isAdvancedSettingsHidden}
                    >
                        <ClearButton
                            isWhite
                            onClick={() => onClear()}
                        >
                            Clear
                        </ClearButton>
                        <SendButton
                            isDisabled={isSendButtonDisabled}
                            onClick={() => onSend()}
                        >
                            {sendButtonText}
                        </SendButton>
                    </FormButtons>
                </AdvancedForm>
            )}


            {props.selectedAccount.pending.length > 0 && (
                <PendingTransactions
                    pending={props.selectedAccount.pending}
                    tokens={props.selectedAccount.tokens}
                    network={network}
                />
            )}
        </Content>
    );
};

export default AccountSend;
