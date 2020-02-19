import React, { useState } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { H2, P, Button } from '@trezor/components-v2';
import { Translation, Loading } from '@suite-components';
import ModalWrapper from '@suite-components/ModalWrapper';
import messages from '@suite/support/messages';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { Dispatch } from '@suite-types';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    changePin: bindActionCreators(deviceSettingsActions.changePin, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps> & {
    onCancel: () => void;
};

const Wrapper = styled(ModalWrapper)`
    display: flex;
    flex-direction: column;
    min-width: 50vw;
    min-height: 50vh;
    align-items: center;
`;

const Video = styled.video`
    width: 500px;
    padding: 20px;
`;

const PinMismatch = ({ changePin }: Props) => {
    const [submitted, setSubmitted] = useState(false);

    const onTryAgain = () => {
        setSubmitted(true);
        changePin({});
    };

    if (submitted) {
        return <Loading />;
    }

    return (
        <Wrapper>
            <H2>
                <Translation {...messages.TR_PIN_MISMATCH_HEADING} />
            </H2>
            <P size="small">
                <Translation {...messages.TR_PIN_MISMATCH_TEXT} />
            </P>
            <Video autoPlay loop>
                <source src={resolveStaticPath(`videos/suite/pin-mismatch.mp4`)} type="video/mp4" />
            </Video>
            <Button onClick={onTryAgain}>
                <Translation {...messages.TR_TRY_AGAIN} />
            </Button>
        </Wrapper>
    );
};

export default connect(null, mapDispatchToProps)(PinMismatch);
