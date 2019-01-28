/* @flow */

import * as React from 'react';
import styled from 'styled-components';
import colors from 'config/colors';

import Link from 'components/Link';
import Input from 'components/inputs/Input';
import Textarea from 'components/Textarea';
import Tooltip from 'components/Tooltip';
import Icon from 'components/Icon';
import ICONS from 'config/icons';
import { FONT_SIZE } from 'config/variables';

import type { Props as BaseProps } from '../../Container';

type Props = BaseProps & {
    children: React.Node,
}

// TODO: Decide on a small screen width for the whole app
// and put it inside config/variables.js
// same variable also in "AccountSend/index.js"
const SmallScreenWidth = '850px';

const InputLabelWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const GreenSpan = styled.span`
    color: ${colors.GREEN_PRIMARY};
`;

const AdvancedSettingsWrapper = styled.div`
    padding: 20px 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    border-top: 1px solid ${colors.DIVIDER};
`;

const GasInputRow = styled.div`
    width: 100%;
    display: flex;

    @media screen and (max-width: ${SmallScreenWidth}) {
        flex-direction: column;
    }
`;

const GasInput = styled(Input)`
    /* min-height: 85px; */
    padding-bottom: 28px;
    &:first-child {
        padding-right: 20px;
    }

    @media screen and (max-width: ${SmallScreenWidth}) {
        &:first-child {
            padding-right: 0;
        }
    }
`;

const StyledTextarea = styled(Textarea)`
    padding-bottom: 28px;
    min-height: 80px;
`;

const AdvancedSettingsSendButtonWrapper = styled.div`
    width: 100%;
    display: flex;
    justify-content: flex-end;
`;

const getGasLimitInputState = (gasLimitErrors: string, gasLimitWarnings: string): string => {
    let state = '';
    if (gasLimitWarnings && !gasLimitErrors) {
        state = 'warning';
    }
    if (gasLimitErrors) {
        state = 'error';
    }
    return state;
};

const getGasPriceInputState = (gasPriceErrors: string, gasPriceWarnings: string): string => {
    let state = '';
    if (gasPriceWarnings && !gasPriceErrors) {
        state = 'warning';
    }
    if (gasPriceErrors) {
        state = 'error';
    }
    return state;
};

const getDataTextareaState = (dataError: string, dataWarning: string): string => {
    let state = '';
    if (dataWarning) {
        state = 'warning';
    }
    if (dataError) {
        state = 'error';
    }
    return state;
};

const Left = styled.div`
    display: flex;
    align-items: center;
`;

const Right = styled.div`
    display: flex;
    flex-direction: row;
    font-size: ${FONT_SIZE.SMALL};
`;

const StyledLink = styled(Link)`
    white-space: nowrap;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;

// stateless component
const AdvancedForm = (props: Props) => {
    const {
        network,
    } = props.selectedAccount;
    if (!network) return null;
    const {
        networkSymbol,
        currency,
        recommendedGasPrice,
        calculatingGasLimit,
        errors,
        warnings,
        infos,
        touched,
        data,
        gasLimit,
        gasPrice,
    } = props.sendForm;
    const {
        setDefaultGasLimit,
        onGasLimitChange,
        onGasPriceChange,
        onDataChange,
    } = props.sendFormActions;
    let gasLimitTooltipCurrency: string;
    let gasLimitTooltipValue: string;
    if (networkSymbol !== currency) {
        gasLimitTooltipCurrency = 'tokens';
        gasLimitTooltipValue = network.defaultGasLimitTokens.toString(10);
    } else {
        gasLimitTooltipCurrency = networkSymbol;
        gasLimitTooltipValue = network.defaultGasLimit.toString(10);
    }

    const showDefaultGasLimitButton = data.length === 0 && touched.gasLimit;

    return (
        <AdvancedSettingsWrapper>
            <GasInputRow>
                <GasInput
                    state={getGasLimitInputState(errors.gasLimit, warnings.gasLimit)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    topLabel={(
                        <InputLabelWrapper>
                            <Left>
                            Gas limit
                                <Tooltip
                                    content={(
                                        <React.Fragment>
                                        Gas limit refers to the maximum amount of gas user is willing to spendon a particular transaction.{' '}
                                            <GreenSpan>Transaction fee = gas limit * gas price</GreenSpan>.{' '}Increasing the gas limit will not get the transaction confirmed sooner.
                                        Default value for sending {gasLimitTooltipCurrency} is <GreenSpan>{gasLimitTooltipValue}</GreenSpan>.
                                        </React.Fragment>
                                    )}
                                    maxWidth={410}
                                    readMoreLink="https://wiki.trezor.io/Ethereum_Wallet#Gas_limit"
                                    placement="top"
                                >
                                    <StyledIcon
                                        icon={ICONS.HELP}
                                        color={colors.TEXT_SECONDARY}
                                        size={24}
                                    />
                                </Tooltip>
                            </Left>
                            { showDefaultGasLimitButton && (
                                <Right>
                                    <StyledLink onClick={setDefaultGasLimit} isGreen>Set default</StyledLink>
                                </Right>)
                            }
                        </InputLabelWrapper>
                    )}
                    bottomText={errors.gasLimit || warnings.gasLimit || infos.gasLimit}
                    value={calculatingGasLimit ? 'Calculating...' : gasLimit}
                    isDisabled={networkSymbol === currency && data.length > 0}
                    onChange={event => onGasLimitChange(event.target.value)}
                />

                <GasInput
                    state={getGasPriceInputState(errors.gasPrice, warnings.gasPrice)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    topLabel={(
                        <InputLabelWrapper>
                            <Left>
                                Gas price
                                <Tooltip
                                    content={(
                                        <React.Fragment>
                                            Gas price refers to the amount of ether you are willing to pay for every
                                            unit of gas, and is usually measured in “Gwei”. <GreenSpan>Transaction fee = gas limit * gas price</GreenSpan>. Increasing the gas price will get the transaction confirmed sooner but
                                            makes it more expensive. The recommended gas price is <GreenSpan>{recommendedGasPrice} GWEI</GreenSpan>.
                                        </React.Fragment>
                                    )}
                                    maxWidth={400}
                                    readMoreLink="https://wiki.trezor.io/Ethereum_Wallet#Gas_price"
                                    placement="top"
                                >
                                    <StyledIcon
                                        icon={ICONS.HELP}
                                        color={colors.TEXT_SECONDARY}
                                        size={24}
                                    />
                                </Tooltip>
                            </Left>
                        </InputLabelWrapper>
                    )}
                    bottomText={errors.gasPrice || warnings.gasPrice || infos.gasPrice}
                    value={gasPrice}
                    onChange={event => onGasPriceChange(event.target.value)}
                />
            </GasInputRow>

            <StyledTextarea
                topLabel={(
                    <InputLabelWrapper>
                        <Left>
                            Data
                            <Tooltip
                                content={(
                                    <React.Fragment>
                                        Data is usually used when you send transactions to contracts.
                                    </React.Fragment>
                                )}
                                placement="top"
                            >
                                <StyledIcon
                                    icon={ICONS.HELP}
                                    color={colors.TEXT_SECONDARY}
                                    size={24}
                                />
                            </Tooltip>
                        </Left>
                    </InputLabelWrapper>
                )}
                state={getDataTextareaState(errors.data, warnings.data)}
                bottomText={errors.data || warnings.data || infos.data}
                isDisabled={networkSymbol !== currency}
                value={networkSymbol !== currency ? '' : data}
                onChange={event => onDataChange(event.target.value)}
            />

            <AdvancedSettingsSendButtonWrapper>
                { props.children }
            </AdvancedSettingsSendButtonWrapper>
        </AdvancedSettingsWrapper>
    );
};

export default AdvancedForm;