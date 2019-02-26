/* @flow */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import icons from 'config/icons';
import { getOldWalletUrl } from 'utils/url';
import colors from 'config/colors';

import { H2 } from 'components/Heading';
import P from 'components/Paragraph';
import Icon from 'components/Icon';
import Button from 'components/Button';
import Link from 'components/Link';

import type { TrezorDevice } from 'flowtype';
import type { Props as BaseProps } from '../../Container';

type Props = {
    onReceiveConfirmation: $ElementType<$ElementType<BaseProps, 'modalActions'>, 'onReceiveConfirmation'>;
    device: ?TrezorDevice;
}

const Wrapper = styled.div`
    max-width: 370px;
    padding: 30px 48px;
`;

const StyledLink = styled(Link)`
    position: absolute;
    right: 15px;
    top: 15px;
`;

const BackupButton = styled(Button)`
    width: 100%;
    margin-bottom: 10px;
`;

const ProceedButton = styled(Button)`
    background: transparent;
    border-color: ${colors.WARNING_PRIMARY};
    color: ${colors.WARNING_PRIMARY};

    &:focus,
    &:hover,
    &:active {
        color: ${colors.WHITE};
        background: ${colors.WARNING_PRIMARY};
        box-shadow: none;
    }
`;

const StyledP = styled(P)`
    padding-bottom: 20px;
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;
`;

const Confirmation = (props: Props) => (
    <Wrapper>
        <StyledLink onClick={() => props.onReceiveConfirmation(false)}>
            <Icon size={24} color={colors.TEXT_SECONDARY} icon={icons.CLOSE} />
        </StyledLink>
        <H2>Your Trezor is not backed up</H2>
        <Icon size={48} color={colors.WARNING_PRIMARY} icon={icons.WARNING} />
        <StyledP isSmaller>If your device is ever lost or damaged, your funds will be lost. Backup your device first, to protect your coins against such events.</StyledP>
        <Row>
            <Link href={`${getOldWalletUrl(props.device)}/?backup`}>
                <BackupButton onClick={() => props.onReceiveConfirmation(false)}>Create a backup in 3 minutes</BackupButton>
            </Link>
            <ProceedButton isWhite onClick={() => props.onReceiveConfirmation(true)}>Show address, I will take the risk</ProceedButton>
        </Row>
    </Wrapper>
);

Confirmation.propTypes = {
    onReceiveConfirmation: PropTypes.func.isRequired,
};

export default Confirmation;