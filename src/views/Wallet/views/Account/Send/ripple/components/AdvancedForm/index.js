/* @flow */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { Input, Tooltip, Icon, colors, icons as ICONS } from 'trezor-ui-components';

import l10nCommonMessages from 'views/common.messages';
import l10nSendMessages from 'views/Wallet/views/Account/common.messages';
import l10nMessages from './index.messages';

import type { Props as BaseProps } from '../../Container';

type Props = BaseProps & {
    children: React.Node,
};

// TODO: Decide on a small screen width for the whole app
// and put it inside config/variables.js
// same variable also in "AccountSend/index.js"
const SmallScreenWidth = '850px';

const InputLabelWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const AdvancedSettingsWrapper = styled.div`
    padding: 20px 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    border-top: 1px solid ${colors.DIVIDER};
`;

const InputRow = styled.div`
    width: 100%;
    display: flex;

    @media screen and (max-width: ${SmallScreenWidth}) {
        flex-direction: column;
    }
`;

const StyledInput = styled(Input)`
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

const AdvancedSettingsSendButtonWrapper = styled.div`
    width: 100%;
    display: flex;
    justify-content: flex-end;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
    padding-right: 1px;
`;

const TooltipContainer = styled.div`
    margin-left: 6px;
`;

const getFeeInputState = (feeErrors: string, feeWarnings: string): ?string => {
    let state = null;
    if (feeWarnings && !feeErrors) {
        state = 'warning';
    }
    if (feeErrors) {
        state = 'error';
    }
    return state;
};

const getDestinationTagInputState = (errors: string, warnings: string): ?string => {
    let state = null;
    if (warnings && !errors) {
        state = 'warning';
    }
    if (errors) {
        state = 'error';
    }
    return state;
};

const Left = styled.div`
    display: flex;
    align-items: center;
`;

// stateless component
const AdvancedForm = (props: Props) => {
    const { network } = props.selectedAccount;
    if (!network) return null;
    const { errors, warnings, infos, fee, destinationTag } = props.sendForm;
    const { onFeeChange, onDestinationTagChange } = props.sendFormActions;

    return (
        <AdvancedSettingsWrapper>
            <InputRow>
                <StyledInput
                    state={getFeeInputState(errors.fee, warnings.fee)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    topLabel={
                        <InputLabelWrapper>
                            <Left>
                                <FormattedMessage {...l10nSendMessages.TR_FEE} />
                                <TooltipContainer>
                                <Tooltip
                                    content={
                                        <FormattedMessage {...l10nMessages.TR_XRP_TRANSFER_COST} />
                                    }
                                    maxWidth={100}
                                    ctaLink="https://developers.ripple.com/transaction-cost.html"
                                    ctaText={
                                        <FormattedMessage {...l10nCommonMessages.TR_LEARN_MORE} />
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
                    bottomText={errors.fee || warnings.fee || infos.fee}
                    value={fee}
                    onChange={event => onFeeChange(event.target.value)}
                />
            </InputRow>

            <InputRow>
                <StyledInput
                    state={getDestinationTagInputState(
                        errors.destinationTag,
                        warnings.destinationTag
                    )}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    topLabel={
                        <InputLabelWrapper>
                            <Left>
                                <FormattedMessage {...l10nMessages.TR_XRP_DESTINATION_TAG} />
                                <TooltipContainer>
                                <Tooltip
                                    content={
                                        <FormattedMessage
                                            {...l10nMessages.TR_XRP_DESTINATION_TAG_EXPLAINED}
                                        />
                                    }
                                    maxWidth={200}
                                    ctaLink="https://wiki.trezor.io/Ripple_(XRP)"
                                    ctaText={
                                        <FormattedMessage {...l10nCommonMessages.TR_LEARN_MORE} />
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
                        errors.destinationTag || warnings.destinationTag || infos.destinationTag
                    }
                    value={destinationTag}
                    onChange={event => onDestinationTagChange(event.target.value)}
                />
            </InputRow>

            <AdvancedSettingsSendButtonWrapper>{props.children}</AdvancedSettingsSendButtonWrapper>
        </AdvancedSettingsWrapper>
    );
};

export default AdvancedForm;
