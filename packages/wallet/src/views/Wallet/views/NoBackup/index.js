/* @flow */
import React from 'react';
import styled from 'styled-components';
import { Button, Icon, Link, P, H4, colors, icons } from 'trezor-ui-components';
import { getOldWalletUrl } from 'utils/url';
import { FormattedMessage } from 'react-intl';
import l10nCommonMessages from 'views/common.messages';
import type { TrezorDevice } from 'flowtype';
import l10nMessages from './index.messages';

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

const NoBackup = (props: Props) => (
    <Wrapper>
        <StyledIcon size={64} color={colors.WARNING_PRIMARY} icon={icons.WARNING} />
        <StyledH>
            <FormattedMessage {...l10nCommonMessages.TR_YOUR_TREZOR_IS_NOT_BACKED_UP} />
        </StyledH>
        <Message>
            <StyledP>
                <FormattedMessage {...l10nCommonMessages.TR_IF_YOUR_DEVICE_IS_EVER_LOST} />
            </StyledP>
            <P>
                <FormattedMessage {...l10nMessages.TR_PLEASE_USE_TO_CREATE_BACKUP} />
            </P>
        </Message>
        <Link href={`${getOldWalletUrl(props.device)}?backup=1`} target="_self">
            <Button>
                <FormattedMessage {...l10nCommonMessages.TR_TAKE_ME_TO_BITCOIN_WALLET} />
            </Button>
        </Link>
        <StyledNavLink isGray to="/">
            <FormattedMessage {...l10nCommonMessages.TR_I_WILL_DO_THAT_LATER} />
        </StyledNavLink>
    </Wrapper>
);

export default NoBackup;
