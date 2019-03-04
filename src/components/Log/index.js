/* @flow */
import React from 'react';
import styled from 'styled-components';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import colors from 'config/colors';
import { H2 } from 'components/Heading';
import Button from 'components/Button';
import Tooltip from 'components/Tooltip';
import ReactJson from 'react-json-view';
import Icon from 'components/Icon';
import P from 'components/Paragraph';
import { FormattedMessage } from 'react-intl';


import * as LogActions from 'actions/LogActions';
import icons from 'config/icons';
import type { State, Dispatch } from 'flowtype';
import l10nMessages from './index.messages';

type Props = {
    log: $ElementType<State, 'log'>,
    toggle: typeof LogActions.toggle,
    copyToClipboard: typeof LogActions.copyToClipboard,
    resetCopyState: typeof LogActions.resetCopyState,
}

const Wrapper = styled.div`
    position: relative;
    color: ${colors.INFO_PRIMARY};
    background: ${colors.INFO_SECONDARY};
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

const CopyWrapper = styled.div`
`;

const ButtonCopy = styled(Button)`
    margin-top: 10px;
`;

const Log = (props: Props): ?React$Element<string> => {
    if (!props.log.opened) return null;

    const copyBtn = (
        <ButtonCopy onClick={() => props.copyToClipboard()}>
            <FormattedMessage {...l10nMessages.TR_COPY_TO_CLIPBOARD} />
        </ButtonCopy>
    );
    return (
        <Wrapper>
            <Click onClick={props.toggle}>
                <Icon size={24} color={colors.INFO_PRIMARY} icon={icons.CLOSE} />
            </Click>
            <H2>
                <FormattedMessage {...l10nMessages.TR_LOG} />
            </H2>
            <StyledParagraph isSmaller>
                <FormattedMessage {...l10nMessages.TR_ATTENTION_COLON_THE_LOG_CONTAINS} />
            </StyledParagraph>
            <LogWrapper>
                <ReactJson src={props.log.entries} />
            </LogWrapper>
            {props.log.copied ? (
                <Tooltip
                    defaultVisible
                    maxWidth={285}
                    placement="top"
                    content={<FormattedMessage {...l10nMessages.TR_COPIED} />}
                    afterVisibleChange={props.resetCopyState}
                >

                    {copyBtn}
                </Tooltip>
            ) : (
                <CopyWrapper>{copyBtn}</CopyWrapper>
            )
            }
        </Wrapper>
    );
};

export default connect(
    (state: State) => ({
        log: state.log,
    }),
    (dispatch: Dispatch) => ({
        toggle: bindActionCreators(LogActions.toggle, dispatch),
        copyToClipboard: bindActionCreators(LogActions.copyToClipboard, dispatch),
        resetCopyState: bindActionCreators(LogActions.resetCopyState, dispatch),
    }),
)(Log);