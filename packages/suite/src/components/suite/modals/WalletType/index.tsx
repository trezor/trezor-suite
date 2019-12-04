import React, { FunctionComponent } from 'react';
import styled, { css } from 'styled-components';

import { Icon, Tooltip, colors } from '@trezor/components';
import { Button, H2, P, Link } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import { useKeyPress } from '@suite-utils/dom';
import messages from '@suite/support/messages';
import { TrezorDevice } from '@suite-types';

const Wrapper = styled.div``;

const Header = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: 5px;

    color: ${colors.TEXT_PRIMARY};
`;

const StyledHeading = styled(H2)`
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
                <StyledLink onClick={onCancel}>
                    <Icon size={12} color={colors.TEXT_SECONDARY} icon="CLOSE" />
                </StyledLink>
            )}
            <StyledHeading>
                {device.state ? (
                    <Translation
                        {...messages.TR_CHANGE_WALLET_TYPE_FOR}
                        values={{ deviceLabel: device.instanceLabel }}
                    />
                ) : (
                    <Translation
                        {...messages.TR_SELECT_WALLET_TYPE_FOR}
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
                    <Translation {...messages.TR_STANDARD_WALLET} />
                </Header>
                <P size="small">
                    <Translation {...messages.TR_CONTINUE_TO_ACCESS_STANDARD_WALLET} />
                </P>
                <StyledButton onClick={() => onWalletTypeRequest(false)} inlineWidth>
                    <Translation {...messages.TR_GO_TO_STANDARD_WALLET} />
                </StyledButton>
            </Content>
            <Content>
                <TooltipContainer>
                    <Tooltip
                        maxWidth={285}
                        placement="top"
                        // todo: add link to config
                        ctaLink="https://wiki.trezor.io/Passphrase"
                        ctaText={<Translation {...messages.TR_LEARN_MORE_LINK} />}
                        content={<Translation {...messages.TR_PASSPHRASE_IS_OPTIONAL_FEATURE} />}
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
                    <Translation {...messages.TR_HIDDEN_WALLET} />
                </Header>
                <P size="small">
                    <Translation {...messages.TR_ASKED_ENTER_YOUR_PASSPHRASE_TO_UNLOCK} />
                </P>
                <StyledButton
                    variant="secondary"
                    onClick={() => onWalletTypeRequest(true)}
                    inlineWidth
                >
                    <Translation {...messages.TR_GO_TO_HIDDEN_WALLET} />
                </StyledButton>
            </Content>
        </Wrapper>
    );
};

export default WalletType;
