/* @flow */

import React from 'react';
import styled from 'styled-components';
import colors from 'config/colors';

import Input from 'components/inputs/Input';
import Textarea from 'components/Textarea';
import Tooltip from 'components/Tooltip';
import Icon from 'components/Icon';
import Link from 'components/Link';
import ICONS from 'config/icons';

import type { Props } from '../../Container';

const InputRow = styled.div`
    margin-bottom: 20px;
`;

const InputLabelWrapper = styled.div`
    display: flex;
    align-items: center;
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

const GasInputRow = styled(InputRow)`
    width: 100%;
    display: flex;
`;

const GasInput = styled(Input)`
    &:first-child {
        padding-right: 20px;
    }
`;

const StyledTextarea = styled(Textarea)`
    margin-bottom: 20px;
    height: 80px;
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
        errors,
        warnings,
        infos,
        data,
        gasLimit,
        gasPrice,
    } = props.sendForm;
    const {
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
                    bottomText={errors.gasLimit || warnings.gasLimit || infos.gasLimit}
                    value={gasLimit}
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
                    bottomText={errors.gasPrice || warnings.gasPrice || infos.gasPrice}
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
                bottomText={errors.data || warnings.data || infos.data}
                disabled={networkSymbol !== currency}
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