/* @flow */

import React, { useState } from 'react';
import BigNumber from 'bignumber.js';
import styled, { css } from 'styled-components';
import { Select, Button, Input, Link, Icon, P, colors, icons as ICONS } from 'trezor-ui-components';
import { FONT_SIZE, FONT_WEIGHT, SCREEN_SIZE } from 'config/variables';
import { FIAT_CURRENCIES } from 'config/app';
import Title from 'views/Wallet/components/Title';
import Content from 'views/Wallet/components/Content';
import * as stateUtils from 'reducers/utils';
import type { Token } from 'flowtype';
import { FormattedMessage } from 'react-intl';
import l10nCommonMessages from 'views/common.messages';
import { getBottomText } from 'utils/uiUtils';
import AdvancedForm from './components/AdvancedForm';
import PendingTransactions from '../components/PendingTransactions';

import l10nMessages from './index.messages';
import l10nSendMessages from '../../common.messages';
import type { Props } from './Container';

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

const LocalAmountWrapper = styled.div`
    display: flex;
    align-self: flex-start;
    margin-top: 26px;

    @media screen and (max-width: ${SCREEN_SIZE.MD}) {
        flex: 1 0 100%;
        justify-content: flex-end;
        margin-top: 0px;
        padding-top: 28px;
    }
`;

const AmountRow = styled(InputRow)`
    display: flex;
    align-items: flex-end;
    padding-bottom: 28px;

    @media screen and (max-width: ${SCREEN_SIZE.MD}) {
        flex-wrap: wrap;
    }
`;

const LocalAmountInput = styled(Input)`
    @media screen and (max-width: ${SCREEN_SIZE.MD}) {
        flex: 1 1 100%;
    }
`;

const LocalCurrencySelect = styled(Select)`
    min-width: 77px;
    height: 40px;

    @media screen and (max-width: ${SCREEN_SIZE.MD}) {
        flex: 1 1 0;
    }
`;

const SetMaxAmountButton = styled(Button)`
    padding: 0 10px;
    font-size: ${FONT_SIZE.SMALL};
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

    @media screen and (max-width: ${SCREEN_SIZE.MD}) {
        ${props =>
            props.isAdvancedSettingsHidden &&
            css`
                flex-direction: column;
            `}
    }
`;

const ToggleAdvancedSettingsButton = styled(Button)`
    min-height: 40px;
    padding: 0;
    display: flex;
    flex: 1 1 0;
    align-items: center;
    font-weight: ${FONT_WEIGHT.MEDIUM};
    justify-content: flex-start;
`;

const FormButtons = styled.div`
    display: flex;
    flex: 1 1;

    @media screen and (max-width: ${SCREEN_SIZE.MD}) {
        margin-top: ${props => (props.isAdvancedSettingsHidden ? '10px' : 0)};
    }

    button + button {
        margin-left: 5px;
    }
`;

const SendButton = styled(Button)`
    word-break: break-all;
    flex: 1;
`;

const ClearButton = styled(Button)``;

const AdvancedSettingsIcon = styled(Icon)`
    margin-left: 10px;
    margin-right: 6px;
`;

const QrButton = styled(Button)`
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
    border-left: 0px;
    height: 40px;
    padding: 0 10px;
`;

const EqualsSign = styled.div`
    align-self: center;
    padding: 0 10px;
    font-size: ${FONT_SIZE.BIGGER};

    @media screen and (max-width: ${SCREEN_SIZE.MD}) {
        display: none;
    }
`;

const StyledIcon = styled(Icon)`
    margin-right: 6px;
`;

// render helpers
const getAddressInputState = (
    address: string,
    addressErrors: boolean,
    addressWarnings: boolean
): ?string => {
    let state = null;
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

const getAmountInputState = (amountErrors: boolean, amountWarnings: boolean): ?string => {
    let state = null;
    if (amountWarnings && !amountErrors) {
        state = 'warning';
    }
    if (amountErrors) {
        state = 'error';
    }
    return state;
};

const getTokensSelectData = (
    tokens: Array<Token>,
    accountNetwork: any
): Array<{ value: string, label: string }> => {
    const tokensSelectData: Array<{ value: string, label: string }> = tokens.map(t => ({
        value: t.symbol,
        label: t.symbol,
    }));
    tokensSelectData.unshift({ value: accountNetwork.symbol, label: accountNetwork.symbol });

    return tokensSelectData;
};

const buildCurrencyOption = currency => {
    return { value: currency, label: currency.toUpperCase() };
};

// stateless component
const AccountSend = (props: Props) => {
    const device = props.wallet.selectedDevice;
    const { account, network, discovery, tokens, shouldRender } = props.selectedAccount;
    const {
        address,
        amount,
        localAmount,
        setMax,
        networkSymbol,
        currency,
        localCurrency,
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
        onLocalAmountChange,
        onSetMax,
        onCurrencyChange,
        onLocalCurrencyChange,
        onFeeLevelChange,
        updateFeeLevels,
        onSend,
        onClear,
    } = props.sendFormActions;

    const [touched, setTouched] = useState(false);

    if (!device || !account || !discovery || !network || !shouldRender) {
        const { loader, exceptionPage } = props.selectedAccount;
        return <Content loader={loader} exceptionPage={exceptionPage} isLoading />;
    }

    const isCurrentCurrencyToken = networkSymbol !== currency;

    let selectedTokenBalance = '0';
    const selectedToken = tokens.find(t => t.symbol === currency);
    if (selectedToken) {
        const pendingAmount: BigNumber = stateUtils.getPendingAmount(
            props.selectedAccount.pending,
            selectedToken.symbol,
            true
        );
        selectedTokenBalance = new BigNumber(selectedToken.balance)
            .minus(pendingAmount)
            .toString(10);
    }

    let isSendButtonDisabled: boolean =
        Object.keys(errors).length > 0 ||
        total === '0' ||
        amount.length === 0 ||
        address.length === 0 ||
        sending ||
        account.imported;

    let amountText = '';
    if (networkSymbol !== currency && amount.length > 0 && !errors.amount) {
        amountText = `${amount} ${currency.toUpperCase()}`;
    } else if (networkSymbol === currency && total !== '0') {
        amountText = `${total} ${network.symbol}`;
    }
    let sendButtonText = (
        <FormattedMessage {...l10nSendMessages.TR_SEND} values={{ amount: amountText }} />
    );

    if (!device.connected) {
        sendButtonText = <FormattedMessage {...l10nSendMessages.TR_DEVICE_IS_NOT_CONNECTED} />;
        isSendButtonDisabled = true;
    } else if (!device.available) {
        sendButtonText = <FormattedMessage {...l10nSendMessages.TR_DEVICE_IS_UNAVAILABLE} />;
        isSendButtonDisabled = true;
    } else if (!discovery.completed) {
        sendButtonText = <FormattedMessage {...l10nSendMessages.TR_LOADING_ACCOUNTS} />;
        isSendButtonDisabled = true;
    }

    const tokensSelectData = getTokensSelectData(tokens, network);
    const tokensSelectData = getTokensSelectData(tokens, network);
    const tokensSelectValue = tokensSelectData.find(t => t.value === currency);
    const isAdvancedSettingsHidden = !advanced;

    return (
        <Content>
            <Title>
                <FormattedMessage {...l10nMessages.TR_SEND_ETHEREUM_OR_TOKENS} />
            </Title>
            <InputRow>
                <Input
                    state={getAddressInputState(address, !!errors.address, !!warnings.address)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    topLabel={props.intl.formatMessage(l10nCommonMessages.TR_ADDRESS)}
                    bottomText={getBottomText(errors.address, warnings.address, infos.address)}
                    value={address}
                    onChange={event => onAddressChange(event.target.value)}
                    sideAddons={[
                        <QrButton key="qrButton" isWhite onClick={props.openQrModal}>
                            <Icon size={25} color={colors.TEXT_SECONDARY} icon={ICONS.QRCODE} />
                        </QrButton>,
                    ]}
                />
            </InputRow>
            <AmountRow>
                <Input
                    state={getAmountInputState(!!errors.amount, !!warnings.amount)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    topLabel={
                        <AmountInputLabelWrapper>
                            <AmountInputLabel>
                                <FormattedMessage {...l10nSendMessages.TR_AMOUNT} />
                            </AmountInputLabel>
                            {isCurrentCurrencyToken && selectedToken && !props.wallet.hideBalance && (
                                <AmountInputLabel>
                                    <FormattedMessage
                                        {...l10nMessages.YOU_HAVE_TOKEN_BALANCE}
                                        values={{
                                            tokenBalance: `${selectedTokenBalance} ${
                                                selectedToken.symbol
                                            }`,
                                        }}
                                    />
                                </AmountInputLabel>
                            )}
                        </AmountInputLabelWrapper>
                    }
                    value={amount}
                    onChange={event => onAmountChange(event.target.value)}
                    bottomText={getBottomText(errors.amount, warnings.amount, infos.amount)}
                    sideAddons={[
                        <SetMaxAmountButton key="icon" onClick={() => onSetMax()} isWhite={!setMax}>
                            {!setMax && (
                                <StyledIcon
                                    icon={ICONS.TOP}
                                    size={14}
                                    color={colors.TEXT_SECONDARY}
                                />
                            )}
                            {setMax && (
                                <StyledIcon icon={ICONS.SUCCESS} size={14} color={colors.WHITE} />
                            )}
                            <FormattedMessage {...l10nSendMessages.TR_SET_MAX} />
                        </SetMaxAmountButton>,
                        <CurrencySelect
                            key="currency"
                            isSearchable={false}
                            isClearable={false}
                            value={tokensSelectValue}
                            isDisabled={tokensSelectData.length < 2}
                            onChange={onCurrencyChange}
                            options={tokensSelectData}
                        />,
                    ]}
                />
                <LocalAmountWrapper>
                    <EqualsSign>=</EqualsSign>
                    <LocalAmountInput
                        state={getAmountInputState(!!errors.amount, !!warnings.amount)}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        value={localAmount}
                        onChange={event => onLocalAmountChange(event.target.value)}
                        sideAddons={[
                            <LocalCurrencySelect
                                key="local-currency"
                                isSearchable
                                isClearable={false}
                                onChange={option => onLocalCurrencyChange(option)}
                                value={buildCurrencyOption(localCurrency)}
                                options={FIAT_CURRENCIES.map(c => buildCurrencyOption(c))}
                            />,
                        ]}
                    />
                </LocalAmountWrapper>
            </AmountRow>

            <InputRow>
                <FeeLabelWrapper>
                    <FeeLabel>
                        <FormattedMessage {...l10nSendMessages.TR_FEE} />
                    </FeeLabel>
                    {gasPriceNeedsUpdate && (
                        <UpdateFeeWrapper>
                            <StyledIcon
                                icon={ICONS.WARNING}
                                color={colors.WARNING_PRIMARY}
                                size={12}
                            />
                            <FormattedMessage {...l10nSendMessages.TR_RECOMMENDED_FEES_UPDATED} />{' '}
                            <StyledLink onClick={updateFeeLevels} isGreen>
                                <FormattedMessage {...l10nSendMessages.TR_CLICK_HERE_TO_USE_THEM} />
                            </StyledLink>
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
                            <OptionValue>
                                <FormattedMessage {...option.localizedValue} />
                            </OptionValue>
                            <OptionLabel>{option.label}</OptionLabel>
                        </FeeOptionWrapper>
                    )}
                />
            </InputRow>

            <ToggleAdvancedSettingsWrapper isAdvancedSettingsHidden={isAdvancedSettingsHidden}>
                <ToggleAdvancedSettingsButton
                    isTransparent
                    onClick={() => {
                        toggleAdvanced();
                        setTouched(true);
                    }}
                >
                    <FormattedMessage {...l10nSendMessages.TR_ADVANCED_SETTINGS} />
                    <AdvancedSettingsIcon
                        icon={ICONS.ARROW_DOWN}
                        color={colors.TEXT_SECONDARY}
                        size={12}
                        isActive={advanced}
                        canAnimate={touched || advanced}
                    />
                </ToggleAdvancedSettingsButton>

                {isAdvancedSettingsHidden && (
                    <FormButtons isAdvancedSettingsHidden={isAdvancedSettingsHidden}>
                        <ClearButton isWhite onClick={() => onClear()}>
                            <FormattedMessage {...l10nCommonMessages.TR_CLEAR} />
                        </ClearButton>
                        <SendButton isDisabled={isSendButtonDisabled} onClick={() => onSend()}>
                            {sendButtonText}
                        </SendButton>
                    </FormButtons>
                )}
            </ToggleAdvancedSettingsWrapper>

            {advanced && (
                <AdvancedForm {...props}>
                    <FormButtons isAdvancedSettingsHidden={isAdvancedSettingsHidden}>
                        <ClearButton isWhite onClick={() => onClear()}>
                            <FormattedMessage {...l10nCommonMessages.TR_CLEAR} />
                        </ClearButton>
                        <SendButton isDisabled={isSendButtonDisabled} onClick={() => onSend()}>
                            {sendButtonText}
                        </SendButton>
                    </FormButtons>
                </AdvancedForm>
            )}

            {props.selectedAccount.pending.length > 0 ||
                (account.imported && (
                    <PendingTransactions
                        pending={props.selectedAccount.pending}
                        tokens={props.selectedAccount.tokens}
                        network={network}
                    />
                ))}
        </Content>
    );
};

export default AccountSend;
