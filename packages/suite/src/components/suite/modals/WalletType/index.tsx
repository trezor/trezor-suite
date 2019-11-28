import React, { FunctionComponent } from 'react';
import styled, { css } from 'styled-components';

import { H5, P, Link, Icon, Tooltip, colors } from '@trezor/components';
import { Button } from '@trezor/components-v2';
import { FormattedMessage } from 'react-intl';
import { useKeyPress } from '@suite-utils/dom';
import globalMessages from '@suite-support/Messages';
import l10nCommonMessages from '../messages';
import l10nWalletMessages from '@wallet-views/messages';
import l10nMessages from './messages';
import { TrezorDevice } from '@suite-types';

const Wrapper = styled.div``;

const Header = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: 5px;

    color: ${colors.TEXT_PRIMARY};
`;

const StyledHeading = styled(H5)`
    padding: 30px 48px 10px 48px;
`;

const StyledLink = styled(Link)`
    position: absolute;
    right: 15px;
    top: 10px;
`;

const StyledButton = styled(Button)`
    margin: 10px 0 10px 0;
`;

const StyledIcon = styled(Icon)`
    &:hover {
        cursor: pointer;
    }
`;

const TooltipContainer = styled.div`
    position: absolute;
    top: 10px;
    right: 15px;
`;

const Content = styled.div<ContentProps>`
    padding: 55px 48px 40px 48px;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    ${props =>
        props.isTop &&
        css`
            padding-top: 40px;
            border-bottom: 1px solid ${colors.DIVIDER};
        `}
`;

const StyledWalletTypeIcon = styled(Icon)`
    margin-right: 6px;
`;

interface ContentProps {
    isTop?: boolean;
}

interface Props {
    device: TrezorDevice;
    onWalletTypeRequest: (hidden: boolean) => void;
    onCancel: () => void;
}

const WalletType: FunctionComponent<Props> = ({ device, onWalletTypeRequest, onCancel }) => {
    const enterPressed = useKeyPress('Enter');

    if (enterPressed) {
        onWalletTypeRequest(false);
    }

    return (
        <Wrapper>
            {device.state && (
                <StyledLink onClick={onCancel} variant="nostyle">
                    <Icon size={12} color={colors.TEXT_SECONDARY} icon="CLOSE" />
                </StyledLink>
            )}
            <StyledHeading>
                {device.state ? (
                    <FormattedMessage
                        {...l10nMessages.TR_CHANGE_WALLET_TYPE_FOR}
                        values={{ deviceLabel: device.instanceLabel }}
                    />
                ) : (
                    <FormattedMessage
                        {...l10nMessages.TR_SELECT_WALLET_TYPE_FOR}
                        values={{ deviceLabel: device.instanceLabel }}
                    />
                )}
            </StyledHeading>
            <Content isTop>
                <Header>
                    <StyledWalletTypeIcon
                        icon="WALLET_STANDARD"
                        size={16}
                        color={colors.TEXT_PRIMARY}
                    />
                    <FormattedMessage {...l10nMessages.TR_STANDARD_WALLET} />
                </Header>
                <P size="small">
                    <FormattedMessage {...l10nMessages.TR_CONTINUE_TO_ACCESS_STANDARD_WALLET} />
                </P>
                <StyledButton onClick={() => onWalletTypeRequest(false)} inlineWidth>
                    <FormattedMessage {...l10nWalletMessages.TR_GO_TO_STANDARD_WALLET} />
                </StyledButton>
            </Content>
            <Content>
                <TooltipContainer>
                    <Tooltip
                        maxWidth={285}
                        placement="top"
                        // todo: add link to config
                        ctaLink="https://wiki.trezor.io/Passphrase"
                        ctaText={<FormattedMessage {...globalMessages.TR_LEARN_MORE_LINK} />}
                        content={
                            <FormattedMessage {...l10nMessages.TR_PASSPHRASE_IS_OPTIONAL_FEATURE} />
                        }
                    >
                        <StyledIcon icon="HELP" color={colors.TEXT_SECONDARY} size={16} />
                    </Tooltip>
                </TooltipContainer>
                <Header>
                    <StyledWalletTypeIcon
                        icon="WALLET_HIDDEN"
                        size={16}
                        color={colors.TEXT_PRIMARY}
                    />
                    <FormattedMessage {...l10nMessages.TR_HIDDEN_WALLET} />
                </Header>
                <P size="small">
                    <FormattedMessage {...l10nMessages.TR_ASKED_ENTER_YOUR_PASSPHRASE_TO_UNLOCK} />
                </P>
                <StyledButton
                    variant="secondary"
                    onClick={() => onWalletTypeRequest(true)}
                    inlineWidth
                >
                    <FormattedMessage {...l10nCommonMessages.TR_GO_TO_HIDDEN_WALLET} />
                </StyledButton>
            </Content>
        </Wrapper>
    );
};

export default WalletType;
