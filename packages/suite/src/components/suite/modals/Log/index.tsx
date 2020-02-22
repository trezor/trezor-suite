import React, { createRef } from 'react';
import styled from 'styled-components';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Button, H2, P } from '@trezor/components';
import { Translation } from '@suite-components';
import ModalWrapper from '@suite-components/ModalWrapper';
import * as notificationActions from '@suite-actions/notificationActions';
import { AppState, Dispatch } from '@suite-types';
import messages from '@suite/support/messages';
import { copyToClipboard } from '@suite-utils/dom';

const Wrapper = styled(ModalWrapper)`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const StyledParagraph = styled(P)`
    margin: 10px 0;
`;

const LogWrapper = styled.div`
    background: white;
    padding: 25px;
    height: 300px;
    overflow: auto;
`;

const ButtonCopy = styled(Button)`
    margin-top: 10px;
`;

const mapStateToProps = (state: AppState) => ({
    log: state.log,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    addNotification: bindActionCreators(notificationActions.add, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> & {
        onCancel: () => void;
    };

const Log = (props: Props) => {
    const htmlElement = createRef<HTMLDivElement>();

    const getFormattedLog = () => {
        // todo: finish, depends on requierements from product;
        return JSON.stringify(props.log.entries);
    };

    const copy = () => {
        const result = copyToClipboard(getFormattedLog(), htmlElement.current);
        if (typeof result === 'string') {
            props.addNotification({ type: 'copy-to-clipboard-error', error: result });
        } else {
            props.addNotification({ type: 'copy-to-clipboard-success' });
        }
    };

    return (
        <Wrapper ref={htmlElement}>
            <H2>
                <Translation {...messages.TR_LOG} />
            </H2>
            <StyledParagraph size="small">
                <Translation {...messages.TR_ATTENTION_COLON_THE_LOG_CONTAINS} />
            </StyledParagraph>
            <LogWrapper>{getFormattedLog()}</LogWrapper>
            <ButtonCopy onClick={() => copy()} data-test="@log/copy-button">
                <Translation {...messages.TR_COPY_TO_CLIPBOARD} />
            </ButtonCopy>
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Log);
