import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { FormattedMessage } from 'react-intl';
import { Button, Icon, P, H5, colors, icons } from 'trezor-ui-components';

import { FONT_SIZE } from 'config/variables';
import * as WalletActions from 'actions/WalletActions';
import l10nMessages from './index.messages';

const Wrapper = styled.div`
    width: 100%;
    min-height: 100vh;
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

const BetaDisclaimer = (props: Props) => (
    <Wrapper>
        <ModalWindow>
            <H5>
                <FormattedMessage {...l10nMessages.TR_YOU_ARE_OPENING_TREZOR_BETA_WALLET} />
            </H5>
            <StyledP>
                <FormattedMessage
                    {...l10nMessages.TR_TREZOR_BETA_WALLET_IS}
                    values={{
                        TR_TREZOR_WALLET: (
                            <i>
                                <FormattedMessage {...l10nMessages.TR_TREZOR_WALLET} />
                            </i>
                        ),
                        TR_TREZOR_BETA_WALLET: (
                            <i>
                                <FormattedMessage {...l10nMessages.TR_TREZOR_BETA_WALLET} />
                            </i>
                        ),
                    }}
                />
            </StyledP>
            <StyledP>
                <FormattedMessage
                    {...l10nMessages.TR_IN_CONTRAST_COMMA_TREZOR}
                    values={{
                        TR_TREZOR_WALLET: (
                            <i>
                                <FormattedMessage {...l10nMessages.TR_TREZOR_WALLET} />
                            </i>
                        ),
                        TR_TREZOR_BETA_WALLET: (
                            <i>
                                <FormattedMessage {...l10nMessages.TR_TREZOR_BETA_WALLET} />
                            </i>
                        ),
                    }}
                />
            </StyledP>
            <StyledP>
                <StyledIcon size={12} color={colors.WARNING_PRIMARY} icon={icons.WARNING} />
                <FormattedMessage
                    {...l10nMessages.TR_PLEASE_NOTE_THAT_THE_TREZOR}
                    values={{
                        TR_TREZOR_WALLET: (
                            <i>
                                <FormattedMessage {...l10nMessages.TR_TREZOR_WALLET} />
                            </i>
                        ),
                        TR_TREZOR_BETA_WALLET: (
                            <i>
                                <FormattedMessage {...l10nMessages.TR_TREZOR_BETA_WALLET} />
                            </i>
                        ),
                    }}
                />
            </StyledP>
            <StyledButton dataTest="Modal__disclaimer__button__confirm" onClick={props.close}>
                <FormattedMessage {...l10nMessages.TR_OK_COMMA_I_UNDERSTAND} />
            </StyledButton>
        </ModalWindow>
    </Wrapper>
);

export default connect<Props, OwnProps, StateProps, DispatchProps, State, Dispatch>(
    null,
    (dispatch: Dispatch): DispatchProps => ({
        close: bindActionCreators(WalletActions.hideBetaDisclaimer, dispatch),
    }),
)(BetaDisclaimer);
