/* @flow */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { getOldWalletUrl } from 'utils/url';

import { H5, P, Icon, Button, Link, colors, icons } from 'trezor-ui-components';
import l10nCommonMessages from 'views/common.messages';

import type { TrezorDevice } from 'flowtype';
import type { Props as BaseProps } from '../../Container';

type Props = {
    onReceiveConfirmation: $ElementType<
        $ElementType<BaseProps, 'modalActions'>,
        'onReceiveConfirmation'
    >,
    device: ?TrezorDevice,
};

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
    /* boost-specificity hack to override P base styling */
    && {
        padding-bottom: 20px;
    }
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;
`;

const Confirmation = (props: Props) => (
    <Wrapper>
        <StyledLink onClick={() => props.onReceiveConfirmation(false)}>
            <Icon size={12} color={colors.TEXT_SECONDARY} icon={icons.CLOSE} />
        </StyledLink>
        <H5>
            <FormattedMessage {...l10nCommonMessages.TR_YOUR_TREZOR_IS_NOT_BACKED_UP} />
        </H5>
        <Icon size={32} color={colors.WARNING_PRIMARY} icon={icons.WARNING} />
        <StyledP size="small">
            <FormattedMessage {...l10nCommonMessages.TR_IF_YOUR_DEVICE_IS_EVER_LOST} />
        </StyledP>
        <Row>
            <Link href={`${getOldWalletUrl(props.device)}/?backup`} target="_self">
                <BackupButton onClick={() => props.onReceiveConfirmation(false)}>
                    <FormattedMessage {...l10nCommonMessages.TR_CREATE_BACKUP_IN_3_MINUTES} />
                </BackupButton>
            </Link>
            <ProceedButton isWhite onClick={() => props.onReceiveConfirmation(true)}>
                <FormattedMessage {...l10nCommonMessages.TR_SHOW_ADDRESS_I_WILL_TAKE_THE_RISK} />
            </ProceedButton>
        </Row>
    </Wrapper>
);

Confirmation.propTypes = {
    onReceiveConfirmation: PropTypes.func.isRequired,
};

export default Confirmation;
