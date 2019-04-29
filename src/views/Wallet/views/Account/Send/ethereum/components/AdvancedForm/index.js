/* @flow */

import * as React from 'react';
import styled from 'styled-components';
import { FormattedMessage, injectIntl } from 'react-intl';
import {
    Link,
    Input,
    TextArea as Textarea,
    Tooltip,
    Icon,
    colors,
    icons as ICONS,
} from 'trezor-ui-components';
import type { IntlShape } from 'react-intl';

import { FONT_SIZE } from 'config/variables';

import l10nCommonMessages from 'views/common.messages';
import l10nMessages from './index.messages';

import type { Props as BaseProps } from '../../Container';

type Props = {| ...BaseProps, intl: IntlShape, children: React.Node |};

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

const getGasLimitInputState = (gasLimitErrors: boolean, gasLimitWarnings: boolean): ?string => {
    let state = null;
    if (gasLimitWarnings && !gasLimitErrors) {
        state = 'warning';
    }
    if (gasLimitErrors) {
        state = 'error';
    }
    return state;
};

const getGasPriceInputState = (gasPriceErrors: boolean, gasPriceWarnings: boolean): ?string => {
    let state = null;
    if (gasPriceWarnings && !gasPriceErrors) {
        state = 'warning';
    }
    if (gasPriceErrors) {
        state = 'error';
    }
    return state;
};

const getDataTextareaState = (dataError: boolean, dataWarning: boolean): ?string => {
    let state = null;
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
    margin-right: 1px;
`;

const TooltipContainer = styled.div`
    margin-left: 6px;
`;

// stateless component
const AdvancedForm = (props: Props) => {
    const { network } = props.selectedAccount;
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
                    state={getGasLimitInputState(!!errors.gasLimit, !!warnings.gasLimit)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    topLabel={
                        <InputLabelWrapper>
                            <Left>
                                <FormattedMessage {...l10nMessages.TR_GAS_LIMIT} />
                                <TooltipContainer>
                                    <Tooltip
                                        content={
                                            <FormattedMessage
                                                {...l10nMessages.TR_GAS_LIMIT_REFERS_TO}
                                                values={{
                                                    TR_GAS_QUOTATION: (
                                                        <GreenSpan>
                                                            <FormattedMessage
                                                                {...l10nMessages.TR_GAS_QUOTATION}
                                                            />
                                                        </GreenSpan>
                                                    ),
                                                    gasLimitTooltipValue: (
                                                        <GreenSpan>
                                                            {gasLimitTooltipValue}
                                                        </GreenSpan>
                                                    ),
                                                    gasLimitTooltipCurrency,
                                                }}
                                            />
                                        }
                                        maxWidth={410}
                                        ctaLink="https://wiki.trezor.io/Ethereum_Wallet#Gas_limit"
                                        ctaText={
                                            <FormattedMessage
                                                {...l10nCommonMessages.TR_LEARN_MORE}
                                            />
                                        }
                                        placement="top"
                                    >
                                        <StyledIcon
                                            icon={ICONS.HELP}
                                            color={colors.TEXT_SECONDARY}
                                            size={12}
                                        />
                                    </Tooltip>
                                </TooltipContainer>
                            </Left>
                            {showDefaultGasLimitButton && (
                                <Right>
                                    <StyledLink onClick={setDefaultGasLimit} isGreen>
                                        <FormattedMessage {...l10nMessages.TR_SET_DEFAULT} />
                                    </StyledLink>
                                </Right>
                            )}
                        </InputLabelWrapper>
                    }
                    bottomText={
                        <>
                            {(errors.gasLimit && <FormattedMessage {...errors.gasLimit} />) ||
                                (warnings.gasLimit && (
                                    <FormattedMessage {...warnings.gasLimit} />
                                )) ||
                                (infos.gasLimit && <FormattedMessage {...infos.gasLimit} />)}
                        </>
                    }
                    value={
                        calculatingGasLimit
                            ? props.intl.formatMessage(l10nMessages.TR_CALCULATING_DOT_DOT)
                            : gasLimit
                    } // TODO: figure out translations in inputs
                    isDisabled={networkSymbol === currency && data.length > 0}
                    onChange={event => onGasLimitChange(event.target.value)}
                />

                <GasInput
                    state={getGasPriceInputState(!!errors.gasPrice, !!warnings.gasPrice)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    topLabel={
                        <InputLabelWrapper>
                            <Left>
                                <FormattedMessage {...l10nMessages.TR_GAS_PRICE} />
                                <TooltipContainer>
                                    <Tooltip
                                        content={
                                            <FormattedMessage
                                                {...l10nMessages.TR_GAS_PRICE_REFERS_TO}
                                                values={{
                                                    TR_GAS_PRICE_QUOTATION: (
                                                        <GreenSpan>
                                                            <FormattedMessage
                                                                {...l10nMessages.TR_GAS_PRICE_QUOTATION}
                                                            />
                                                        </GreenSpan>
                                                    ),
                                                    recommendedGasPrice: (
                                                        <GreenSpan>{recommendedGasPrice}</GreenSpan>
                                                    ),
                                                }}
                                            />
                                        }
                                        maxWidth={400}
                                        ctaLink="https://wiki.trezor.io/Ethereum_Wallet#Gas_price"
                                        ctaText={
                                            <FormattedMessage
                                                {...l10nCommonMessages.TR_LEARN_MORE}
                                            />
                                        }
                                        placement="top"
                                    >
                                        <StyledIcon
                                            icon={ICONS.HELP}
                                            color={colors.TEXT_SECONDARY}
                                            size={12}
                                        />
                                    </Tooltip>
                                </TooltipContainer>
                            </Left>
                        </InputLabelWrapper>
                    }
                    bottomText={
                        <>
                            {(errors.gasPrice && <FormattedMessage {...errors.gasPrice} />) ||
                                (warnings.gasPrice && (
                                    <FormattedMessage {...warnings.gasPrice} />
                                )) ||
                                (infos.v && <FormattedMessage {...infos.gasPrice} />)}
                        </>
                    }
                    value={gasPrice}
                    onChange={event => onGasPriceChange(event.target.value)}
                />
            </GasInputRow>

            <StyledTextarea
                topLabel={
                    <InputLabelWrapper>
                        <Left>
                            <FormattedMessage {...l10nMessages.TR_DATA} />
                            <TooltipContainer>
                                <Tooltip
                                    content={
                                        <FormattedMessage
                                            {...l10nMessages.TR_DATA_IS_USUALLY_USED}
                                        />
                                    }
                                    placement="top"
                                >
                                    <StyledIcon
                                        icon={ICONS.HELP}
                                        color={colors.TEXT_SECONDARY}
                                        size={12}
                                    />
                                </Tooltip>
                            </TooltipContainer>
                        </Left>
                    </InputLabelWrapper>
                }
                state={getDataTextareaState(!!errors.data, !!warnings.data)}
                bottomText={
                    <>
                        {(errors.data && <FormattedMessage {...errors.data} />) ||
                            (warnings.data && <FormattedMessage {...warnings.data} />) ||
                            (infos.data && <FormattedMessage {...infos.data} />)}
                    </>
                }
                isDisabled={networkSymbol !== currency}
                value={networkSymbol !== currency ? '' : data}
                onChange={event => onDataChange(event.target.value)}
            />

            <AdvancedSettingsSendButtonWrapper>{props.children}</AdvancedSettingsSendButtonWrapper>
        </AdvancedSettingsWrapper>
    );
};

export default injectIntl(AdvancedForm);
