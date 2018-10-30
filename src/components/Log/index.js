/* @flow */
import React from 'react';
import styled from 'styled-components';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import colors from 'config/colors';
import { H2 } from 'components/Heading';
import ReactJson from 'react-json-view';
import Icon from 'components/Icon';
import P from 'components/Paragraph';

import * as LogActions from 'actions/LogActions';
import icons from 'config/icons';
import type { State, Dispatch } from 'flowtype';

type Props = {
    log: $ElementType<State, 'log'>,
    toggle: typeof LogActions.toggle
}

const Wrapper = styled.div`
    position: relative;
    color: ${colors.INFO_PRIMARY};
    background: ${colors.INFO_SECONDARY};
    padding: 24px 48px;
    display: flex;
    flex-direction: column;
    text-align: left;
    width: 100%;
`;

const Click = styled.div`
    cursor: pointer;
    position: absolute;
    top: 8px;
    right: 0;
    padding: 12px;
    color: inherit;
    transition: opacity 0.3s;

    &:active,
    &:hover {
        opacity: 0.6;
        color: inherit;
    }
`;

const Textarea = styled.textarea`
    width: 100%;
    height: 200px;
    min-height: 200px;
    resize: vertical;
    font-size: 10px;

    &:focus {
        box-shadow: none;
    }
`;

const StyledParagraph = styled(P)`
    margin: 10px 0;
`;

const LogWrapper = styled.div`
    background: white;
    padding: 25px;
    height: 500px;
    overflow: scroll;
`;

const Log = (props: Props): ?React$Element<string> => {
    if (!props.log.opened) return null;
    return (
        <Wrapper>
            <Click onClick={props.toggle}>
                <Icon size={25} color={colors.INFO_PRIMARY} icon={icons.CLOSE} />
            </Click>
            <H2>Log</H2>
            <StyledParagraph isSmaller>Attention: The log contains your XPUBs. Anyone with your XPUBs can see your account history.</StyledParagraph>
            <LogWrapper>
                <ReactJson src={props.log.entries} />
            </LogWrapper>
        </Wrapper>
    );
};

export default connect(
    (state: State) => ({
        log: state.log,
    }),
    (dispatch: Dispatch) => ({
        toggle: bindActionCreators(LogActions.toggle, dispatch),
    }),
)(Log);