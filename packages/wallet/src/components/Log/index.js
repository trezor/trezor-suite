/* @flow */
import React from 'react';
import styled from 'styled-components';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Button, Tooltip, H5, P, Icon, icons, colors } from 'trezor-ui-components';
import ReactJson from 'react-json-view';
import { FormattedMessage } from 'react-intl';

import * as LogActions from 'actions/LogActions';
import type { State, Dispatch } from 'flowtype';
import l10nMessages from './index.messages';

type OwnProps = {||};
type StateProps = {|
    log: $ElementType<State, 'log'>,
|};

type DispatchProps = {|
    toggle: typeof LogActions.toggle,
    copyToClipboard: typeof LogActions.copyToClipboard,
    resetCopyState: typeof LogActions.resetCopyState,
|};

type Props = {| ...OwnProps, ...StateProps, ...DispatchProps |};

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
    if (!props.log.opened) return null;

    const copyBtn = (
        <ButtonCopy onClick={() => props.copyToClipboard()}>
            <FormattedMessage {...l10nMessages.TR_COPY_TO_CLIPBOARD} />
        </ButtonCopy>
    );
    return (
        <Wrapper>
            <Click onClick={props.toggle}>
                <Icon size={12} color={colors.INFO_PRIMARY} icon={icons.CLOSE} />
            </Click>
            <H5>
                <FormattedMessage {...l10nMessages.TR_LOG} />
            </H5>
            <StyledParagraph size="small">
                <FormattedMessage {...l10nMessages.TR_ATTENTION_COLON_THE_LOG_CONTAINS} />
            </StyledParagraph>
            <LogWrapper>
                <ReactJson src={props.log.entries} />
            </LogWrapper>
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
    );
};

export default connect<Props, OwnProps, StateProps, DispatchProps, State, Dispatch>(
    (state: State): StateProps => ({
        log: state.log,
    }),
    (dispatch: Dispatch): DispatchProps => ({
        toggle: bindActionCreators(LogActions.toggle, dispatch),
        copyToClipboard: bindActionCreators(LogActions.copyToClipboard, dispatch),
        resetCopyState: bindActionCreators(LogActions.resetCopyState, dispatch),
    })
)(Log);
