import React, { createRef } from 'react';
import styled from 'styled-components';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Button, H2, P, colors } from '@trezor/components';
import { Translation } from '@suite-components';
import ModalWrapper from '@suite-components/ModalWrapper';
import * as notificationActions from '@suite-actions/notificationActions';
import { AppState, Dispatch } from '@suite-types';

import { copyToClipboard } from '@suite-utils/dom';

const Wrapper = styled(ModalWrapper)`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const StyledParagraph = styled(P)`
    margin: 10px 0;
`;

const LogWrapper = styled.pre`
    background: white;
    padding: 25px;
    height: 400px;
    max-width: 80vw;
    overflow: auto;
    background-color: ${colors.BLACK96};
    color: ${colors.BLACK0};
    text-align: left;
    word-break: break-all;
`;

const ButtonCopy = styled(Button)`
    margin-top: 10px;
`;

const mapStateToProps = (state: AppState) => ({
    log: state.log,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    addNotification: bindActionCreators(notificationActions.addToast, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> & {
        onCancel: () => void;
    };

const Log = (props: Props) => {
    const htmlElement = createRef<HTMLDivElement>();

    const getFormattedLog = () => {
        return JSON.stringify(props.log.entries, null, 2);
    };

    const copy = () => {
        const result = copyToClipboard(getFormattedLog(), htmlElement.current);
        if (typeof result !== 'string') {
            props.addNotification({ type: 'copy-to-clipboard' });
        }
    };

    return (
        <Wrapper ref={htmlElement}>
            <H2>
                <Translation id="TR_LOG" />
            </H2>
            <StyledParagraph size="small">
                <Translation id="TR_ATTENTION_COLON_THE_LOG_CONTAINS" />
            </StyledParagraph>
            <LogWrapper tabIndex={0}>{getFormattedLog()}</LogWrapper>
            <ButtonCopy onClick={() => copy()} data-test="@log/copy-button">
                <Translation id="TR_COPY_TO_CLIPBOARD" />
            </ButtonCopy>
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Log);
