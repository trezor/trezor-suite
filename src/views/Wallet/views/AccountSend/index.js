/* @flow */

import React, { Component } from 'react';
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
import Textarea from 'components/Textarea';
import Tooltip from 'components/Tooltip';
import { calculate, validation } from 'actions/SendFormActions';
import SelectedAccount from 'views/Wallet/components/SelectedAccount';
import type { Token } from 'flowtype';
import PendingTransactions from './components/PendingTransactions';

import type { Props } from './Container';

type State = {
    isAdvancedSettingsHidden: boolean,
    shouldAnimateAdvancedSettingsToggle: boolean,
};

const Wrapper = styled.section`
    padding: 0 48px;
`;

const StyledH2 = styled(H2)`
    padding: 20px 0;
`;

const InputRow = styled.div`
    margin-bottom: 20px;
`;

const SetMaxAmountButton = styled(Button)`
    height: 34px;
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
    height: 34px;
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
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
`;

const ToggleAdvancedSettingsButton = styled(Button)`
    padding: 0;
    display: flex;
    align-items: center;
    font-weight: ${FONT_WEIGHT.BIGGER};
`;

const SendButton = styled(Button)`
    min-width: 50%;
`;

const AdvancedSettingsWrapper = styled.div`
    padding: 20px 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    border-top: 1px solid ${colors.DIVIDER};
`;

const GasInputRow = styled(InputRow)`
    width: 100%;
    display: flex;
`;

const GasInput = styled(Input)`
    &:first-child {
        padding-right: 20px;
    }
`;

const AdvancedSettingsSendButtonWrapper = styled.div`
    width: 100%;
    display: flex;
    justify-content: flex-end;
`;

const StyledTextarea = styled(Textarea)`
    margin-bottom: 20px;
    height: 80px;
`;

const AdvancedSettingsIcon = styled(Icon)`
    margin-left: 10px;
`;

const GreenSpan = styled.span`
    color: ${colors.GREEN_PRIMARY};
`;

const InputLabelWrapper = styled.div`
    display: flex;
    align-items: center;
`;

class AccountSend extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            isAdvancedSettingsHidden: true,
            shouldAnimateAdvancedSettingsToggle: false,
        };
    }

    componentWillReceiveProps(newProps: Props) {
        calculate(this.props, newProps);
        validation(newProps);

        this.props.saveSessionStorage();
    }

    getAddressInputState(address: string, addressErrors: string, addressWarnings: string) {
        let state = '';
        if (address && !addressErrors) {
            state = 'success';
        } else if (addressWarnings && !addressErrors) {
            state = 'warning';
        } else if (addressErrors) {
            state = 'error';
        }
        return state;
    }

    getAmountInputState(amountErrors: string, amountWarnings: string) {
        let state = '';
        if (amountWarnings && !amountErrors) {
            state = 'warning';
        } else if (amountErrors) {
            state = 'error';
        }
        return state;
    }

    getAmountInputBottomText(amountErrors: string, amountWarnings: string) {
        let text = '';
        if (amountWarnings && !amountErrors) {
            text = amountWarnings;
        } else if (amountErrors) {
            text = amountErrors;
        }
        return text;
    }

    getGasLimitInputState(gasLimitErrors: string, gasLimitWarnings: string) {
        let state = '';
        if (gasLimitWarnings && !gasLimitErrors) {
            state = 'warning';
        } else if (gasLimitErrors) {
            state = 'error';
        }
        return state;
    }

    getGasPriceInputState(gasPriceErrors: string, gasPriceWarnings: string) {
        let state = '';
        if (gasPriceWarnings && !gasPriceErrors) {
            state = 'warning';
        } else if (gasPriceErrors) {
            state = 'error';
        }
        return state;
    }

    getTokensSelectData(tokens: Array<Token>, accountNetwork: any) {
        const tokensSelectData: Array<{ value: string, label: string }> = tokens.map(t => ({ value: t.symbol, label: t.symbol }));
        tokensSelectData.unshift({ value: accountNetwork.symbol, label: accountNetwork.symbol });

        return tokensSelectData;
    }

    handleToggleAdvancedSettingsButton() {
        this.toggleAdvancedSettings();
    }

    toggleAdvancedSettings() {
        this.setState(previousState => ({
            isAdvancedSettingsHidden: !previousState.isAdvancedSettingsHidden,
            shouldAnimateAdvancedSettingsToggle: true,
        }));
    }

    render() {
        const device = this.props.wallet.selectedDevice;
        const {
            account,
            network,
            discovery,
            tokens,
        } = this.props.selectedAccount;
        const {
            address,
            amount,
            setMax,
            networkSymbol,
            currency,
            feeLevels,
            selectedFeeLevel,
            recommendedGasPrice,
            gasPriceNeedsUpdate,
            total,
            errors,
            warnings,
            data,
            sending,
            gasLimit,
            gasPrice,
        } = this.props.sendForm;

        const {
            onAddressChange,
            onAmountChange,
            onSetMax,
            onCurrencyChange,
            onFeeLevelChange,
            updateFeeLevels,
            onSend,
            onGasLimitChange,
            onGasPriceChange,
            onDataChange,
        } = this.props.sendFormActions;

        if (!device || !account || !discovery || !network) return null;

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

        const tokensSelectData = this.getTokensSelectData(tokens, network);

        let gasLimitTooltipCurrency: string;
        let gasLimitTooltipValue: string;
        if (networkSymbol !== currency) {
            gasLimitTooltipCurrency = 'tokens';
            gasLimitTooltipValue = network.defaultGasLimitTokens.toString(10);
        } else {
            gasLimitTooltipCurrency = networkSymbol;
            gasLimitTooltipValue = network.defaultGasLimit.toString(10);
        }


        return (
            <SelectedAccount {...this.props}>
                <Wrapper>
                    <StyledH2>Send Ethereum or tokens</StyledH2>
                    <InputRow>
                        <Input
                            state={this.getAddressInputState(address, errors.address, warnings.address)}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            topLabel="Address"
                            bottomText={errors.address ? 'Wrong Address' : ''}
                            value={address}
                            onChange={event => onAddressChange(event.target.value)}
                        />
                    </InputRow>

                    <InputRow>
                        <Input
                            state={this.getAmountInputState(errors.amount, warnings.amount)}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            topLabel="Amount"
                            value={amount}
                            onChange={event => onAmountChange(event.target.value)}
                            bottomText={this.getAmountInputBottomText(errors.amount, warnings.amount)}
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
                                        defaultValue={tokensSelectData[0]}
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
                            onChange={(option) => {
                                if (option.value === 'Custom') {
                                    this.toggleAdvancedSettings();
                                }
                                onFeeLevelChange(option);
                            }}
                            options={feeLevels}
                            formatOptionLabel={option => (
                                <FeeOptionWrapper>
                                    <P>{option.value}</P>
                                    <P>{option.label}</P>
                                </FeeOptionWrapper>
                            )}
                        />
                    </InputRow>

                    <ToggleAdvancedSettingsWrapper>
                        <ToggleAdvancedSettingsButton
                            isTransparent
                            onClick={() => this.handleToggleAdvancedSettingsButton()}
                        >
                            Advanced settings
                            <AdvancedSettingsIcon
                                icon={ICONS.ARROW_DOWN}
                                color={colors.TEXT_SECONDARY}
                                size={24}
                                isActive={this.state.isAdvancedSettingsHidden}
                                canAnimate={this.state.shouldAnimateAdvancedSettingsToggle}
                            />
                        </ToggleAdvancedSettingsButton>

                        {this.state.isAdvancedSettingsHidden && (
                            <SendButton
                                isDisabled={isSendButtonDisabled}
                                onClick={() => onSend()}
                            >
                                {sendButtonText}
                            </SendButton>
                        )}
                    </ToggleAdvancedSettingsWrapper>

                    {!this.state.isAdvancedSettingsHidden && (
                        <AdvancedSettingsWrapper>
                            <GasInputRow>
                                <GasInput
                                    state={this.getGasLimitInputState(errors.gasLimit, warnings.gasLimit)}
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    spellCheck="false"
                                    topLabel={(
                                        <InputLabelWrapper>
                                            Gas limit
                                            <Tooltip
                                                content={(
                                                    <React.Fragment>
                                                        Gas limit is the amount of gas to send with your transaction.<br />
                                                        <GreenSpan>TX fee = gas price * gas limit</GreenSpan> &amp; is paid to miners for including your TX in a block.<br />
                                                        Increasing this number will not get your TX mined faster.<br />
                                                        Default value for sending {gasLimitTooltipCurrency} is <GreenSpan>{gasLimitTooltipValue}</GreenSpan>
                                                    </React.Fragment>
                                                )}
                                                placement="top"
                                            >
                                                <Icon
                                                    icon={ICONS.HELP}
                                                    color={colors.TEXT_SECONDARY}
                                                    size={24}
                                                />
                                            </Tooltip>
                                        </InputLabelWrapper>
                                    )}
                                    bottomText={errors.gasLimit ? errors.gasLimit : warnings.gasLimit}
                                    value={gasLimit}
                                    isDisabled={networkSymbol === currency && data.length > 0}
                                    onChange={event => onGasLimitChange(event.target.value)}
                                />

                                <GasInput
                                    state={this.getGasPriceInputState(errors.gasPrice, warnings.gasPrice)}
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    spellCheck="false"
                                    topLabel={(
                                        <InputLabelWrapper>
                                            Gas price
                                            <Tooltip
                                                content={(
                                                    <React.Fragment>
                                                        Gas Price is the amount you pay per unit of gas.<br />
                                                        <GreenSpan>TX fee = gas price * gas limit</GreenSpan> &amp; is paid to miners for including your TX in a block.<br />
                                                        Higher the gas price = faster transaction, but more expensive. Recommended is <GreenSpan>{recommendedGasPrice} GWEI.</GreenSpan><br />
                                                        <Link href="https://myetherwallet.github.io/knowledge-base/gas/what-is-gas-ethereum.html" target="_blank" rel="noreferrer noopener" isGreen>Read more</Link>
                                                    </React.Fragment>
                                                )}
                                                placement="top"
                                            >
                                                <Icon
                                                    icon={ICONS.HELP}
                                                    color={colors.TEXT_SECONDARY}
                                                    size={24}
                                                />
                                            </Tooltip>
                                        </InputLabelWrapper>
                                    )}
                                    bottomText={errors.gasPrice ? errors.gasPrice : warnings.gasPrice}
                                    value={gasPrice}
                                    onChange={event => onGasPriceChange(event.target.value)}
                                />
                            </GasInputRow>

                            <StyledTextarea
                                topLabel={(
                                    <InputLabelWrapper>
                                        Data
                                        <Tooltip
                                            content={(
                                                <React.Fragment>
                                                    Data is usually used when you send transactions to contracts.
                                                </React.Fragment>
                                            )}
                                            placement="top"
                                        >
                                            <Icon
                                                icon={ICONS.HELP}
                                                color={colors.TEXT_SECONDARY}
                                                size={24}
                                            />
                                        </Tooltip>
                                    </InputLabelWrapper>
                                )}
                                disabled={networkSymbol !== currency}
                                value={networkSymbol !== currency ? '' : data}
                                onChange={event => onDataChange(event.target.value)}
                            />

                            <AdvancedSettingsSendButtonWrapper>
                                <SendButton
                                    isDisabled={isSendButtonDisabled}
                                    onClick={() => onSend()}
                                >
                                    {sendButtonText}
                                </SendButton>
                            </AdvancedSettingsSendButtonWrapper>
                        </AdvancedSettingsWrapper>
                    )}

                    {this.props.selectedAccount.pending.length > 0 && (
                        <PendingTransactions
                            pending={this.props.selectedAccount.pending}
                            tokens={this.props.selectedAccount.tokens}
                            network={network}
                        />
                    )}
                </Wrapper>
            </SelectedAccount>
        );
    }
}


export default AccountSend;
