import React, { createRef } from 'react';
import styled from 'styled-components';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Button, Modal, colors } from '@trezor/components';
import { Translation } from '@suite-components';
import * as notificationActions from '@suite-actions/notificationActions';
import { AppState, Dispatch } from '@suite-types';

import { copyToClipboard } from '@suite-utils/dom';

const LogWrapper = styled.pre`
    background: white;
    padding: 25px;
    height: 400px;
    width: 100%;
    overflow: auto;
    background-color: ${colors.BLACK96};
    color: ${colors.BLACK0};
    text-align: left;
    word-break: break-all;
`;

const ButtonWrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
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
    const htmlElement = createRef<HTMLPreElement>();

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
        <Modal
            cancelable
            onCancel={props.onCancel}
            heading={<Translation id="TR_LOG" />}
            description={<Translation id="TR_ATTENTION_COLON_THE_LOG_CONTAINS" />}
            bottomBar={
                <ButtonWrapper>
                    <Button onClick={() => copy()} data-test="@log/copy-button">
                        <Translation id="TR_COPY_TO_CLIPBOARD" />
                    </Button>
                </ButtonWrapper>
            }
        >
            <LogWrapper ref={htmlElement}>{getFormattedLog()}</LogWrapper>
        </Modal>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Log);
