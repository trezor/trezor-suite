import React from 'react';
import styled from 'styled-components';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Button, Tooltip, H5, P, Icon, Modal, colors } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import * as logActions from '@suite-actions/logActions';
import { AppState, Dispatch } from '@suite-types';
import l10nMessages from './index.messages';
import { useKeyPress } from '@suite-utils/dom';

interface Props {
    toggle: typeof logActions.toggle;
    copyToClipboard: typeof logActions.copyToClipboard;
    resetCopyState: typeof logActions.resetCopyState;
    log: AppState['log'];
}

const Wrapper = styled.div`
    position: relative;
    color: ${colors.INFO_PRIMARY};
    background: ${colors.INFO_LIGHT};
    padding: 24px;
    display: flex;
    flex-direction: column;
    text-align: left;
    width: 100%;
`;

const Click = styled.div`
    cursor: pointer;
    position: absolute;
    top: 0;
    right: 0;
    padding-right: inherit;
    padding-top: inherit;
    color: inherit;
    transition: opacity 0.3s;

    &:active,
    &:hover {
        opacity: 0.6;
        color: inherit;
    }
`;

const StyledParagraph = styled(P)`
    margin: 10px 0;
`;

const LogWrapper = styled.div`
    background: white;
    padding: 25px;
    height: 300px;
    overflow: scroll;
`;

const CopyWrapper = styled.div``;

const ButtonCopy = styled(Button)`
    margin-top: 10px;
`;

const TooltipContainer = styled.div`
    display: flex;
    flex-direction: row;
`;

const Log = (props: Props) => {
    const escPressed = useKeyPress('Escape');

    if (!props.log.opened) return null;

    if (escPressed) {
        props.toggle();
    }

    const copyBtn = (
        <ButtonCopy onClick={() => props.copyToClipboard()}>
            <FormattedMessage {...l10nMessages.TR_COPY_TO_CLIPBOARD} />
        </ButtonCopy>
    );
    return (
        <Modal>
            <Wrapper>
                <Click onClick={props.toggle}>
                    <Icon size={12} color={colors.INFO_PRIMARY} icon="CLOSE" />
                </Click>
                <H5>
                    <FormattedMessage {...l10nMessages.TR_LOG} />
                </H5>
                <StyledParagraph size="small">
                    <FormattedMessage {...l10nMessages.TR_ATTENTION_COLON_THE_LOG_CONTAINS} />
                </StyledParagraph>
                <LogWrapper>{JSON.stringify(props.log.entries)}</LogWrapper>
                {props.log.copied ? (
                    <TooltipContainer>
                        <Tooltip
                            maxWidth={285}
                            placement="top"
                            content={<FormattedMessage {...l10nMessages.TR_COPIED} />}
                            onHidden={props.resetCopyState}
                        >
                            {copyBtn}
                        </Tooltip>
                    </TooltipContainer>
                ) : (
                    <CopyWrapper>{copyBtn}</CopyWrapper>
                )}
            </Wrapper>
        </Modal>
    );
};

export default connect(
    (state: AppState) => ({
        log: state.log,
    }),
    (dispatch: Dispatch) => ({
        toggle: bindActionCreators(logActions.toggle, dispatch),
        copyToClipboard: bindActionCreators(logActions.copyToClipboard, dispatch),
        resetCopyState: bindActionCreators(logActions.resetCopyState, dispatch),
    }),
)(Log);
