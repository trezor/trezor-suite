import React from 'react';
import styled from 'styled-components';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Button, H2, P } from '@trezor/components-v2';
import { Translation } from '@suite-components';
import ModalWrapper from '@suite-components/ModalWrapper';
import * as logActions from '@suite-actions/logActions';
import { AppState, Dispatch } from '@suite-types';
import messages from '@suite/support/messages';

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
    copyToClipboard: bindActionCreators(logActions.copyToClipboard, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> & {
        onCancel: () => void;
    };

const Log = (props: Props) => {
    return (
        <Wrapper>
            <H2>
                <Translation {...messages.TR_LOG} />
            </H2>
            <StyledParagraph size="small">
                <Translation {...messages.TR_ATTENTION_COLON_THE_LOG_CONTAINS} />
            </StyledParagraph>
            <LogWrapper>{JSON.stringify(props.log.entries)}</LogWrapper>
            <ButtonCopy onClick={() => props.copyToClipboard()}>
                <Translation {...messages.TR_COPY_TO_CLIPBOARD} />
            </ButtonCopy>
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Log);
