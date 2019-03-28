/* @flow */
import React from 'react';
import styled from 'styled-components';
import { Button, Icon, Link, P, H4, colors, icons } from 'trezor-ui-components';
import { getOldWalletUrl } from 'utils/url';

import type { TrezorDevice } from 'flowtype';

type Props = {
    device: ?TrezorDevice,
};

const Wrapper = styled.section`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 90px 35px 40px 35px;
`;

const StyledNavLink = styled(Link)`
    padding-top: 20px;
`;

const StyledH = styled(H4)`
    text-align: center;
`;

const StyledP = styled(P)`
    max-width: 550px;
    padding-bottom: 15px;
`;

const Message = styled.div`
    text-align: center;
    padding: 0 0 15px 0;
`;

const StyledIcon = styled(Icon)`
    margin-bottom: 15px;
`;

const FirmwareUpdate = (props: Props) => (
    <Wrapper>
        <StyledIcon size={64} color={colors.WARNING_PRIMARY} icon={icons.WARNING} />
        <StyledH>Your Trezor is not backed up!</StyledH>
        <Message>
            <StyledP>
                If your device is ever lost or damaged, your funds will be lost. Backup your device
                first, to protect your coins against such events.
            </StyledP>
            <P>Please use Bitcoin wallet interface to create a backup.</P>
        </Message>
        <Link href={`${getOldWalletUrl(props.device)}?backup=1`} target="_self">
            <Button>Take me to the Bitcoin wallet</Button>
        </Link>
        <StyledNavLink isGray to="/">
            I’ll do that later.
        </StyledNavLink>
    </Wrapper>
);

export default FirmwareUpdate;
