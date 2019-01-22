/* @flow */

import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import colors from 'config/colors';
import icons from 'config/icons';
import { FONT_SIZE } from 'config/variables';

import Icon from 'components/Icon';
import Button from 'components/Button';
import P from 'components/Paragraph';
import { H2 } from 'components/Heading';
import * as WalletActions from 'actions/WalletActions';

const Wrapper = styled.div`
    width: 100%;
    height: 100%;
    top: 0px;
    left: 0px;
    background: rgba(0, 0, 0, 0.35);
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
    padding: 20px;
`;

const ModalWindow = styled.div`
    margin: auto;
    position: relative;
    border-radius: 4px;
    background-color: ${colors.WHITE};
    text-align: center;
    width: 100%;
    max-width: 620px;
    padding: 30px 48px;
`;

const StyledP = styled(P)`
    padding: 10px 0px;
    font-size: ${FONT_SIZE.BASE};
`;

const StyledButton = styled(Button)`
    margin: 10px 0px;
    width: 100%;
`;

const StyledIcon = styled(Icon)`
    position: relative;
    top: -1px;
`;

const BetaDisclaimer = (props: { close: () => void }) => (
    <Wrapper>
        <ModalWindow>
            <H2>You are opening Trezor Beta Wallet</H2>
            <StyledP><i>Trezor Beta Wallet</i> is a public feature-testing version of the <i>Trezor Wallet</i>, offering the newest features before they are available to the general public.</StyledP>
            <StyledP>In contrast, <i>Trezor Wallet</i> is feature-conservative, making sure that its functionality is maximally reliable and dependable for the general public.</StyledP>
            <StyledP>
                <StyledIcon
                    size={24}
                    color={colors.WARNING_PRIMARY}
                    icon={icons.WARNING}
                />
                Please note that the <i>Trezor Beta Wallet</i> might be collecting anonymized usage data, especially error logs, for development purposes. The <i>Trezor Wallet</i> does not log any data.
            </StyledP>
            <StyledButton onClick={props.close}>OK, I understand</StyledButton>
        </ModalWindow>
    </Wrapper>
);

export default connect(
    null,
    (dispatch: Dispatch) => ({
        close: bindActionCreators(WalletActions.hideBetaDisclaimer, dispatch),
    }),
)(BetaDisclaimer);