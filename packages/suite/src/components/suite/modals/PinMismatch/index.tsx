import React, { useState } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { H2, P, Button } from '@trezor/components';
import { Translation, Loading, Image } from '@suite-components';
import ModalWrapper from '@suite-components/ModalWrapper';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { Dispatch } from '@suite-types';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    changePin: bindActionCreators(deviceSettingsActions.changePin, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps> & {
    onCancel: () => void;
};

const StyledImage = styled(Image)`
    flex: 1;
`;

const Wrapper = styled(ModalWrapper)`
    display: flex;
    flex-direction: column;
    min-width: 50vw;
    min-height: 50vh;
    align-items: center;
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
                <Translation id="TR_PIN_MISMATCH_HEADING" />
            </H2>
            <P tabIndex={0} size="small">
                <Translation id="TR_PIN_MISMATCH_TEXT" />
            </P>
            <StyledImage image="UNI_ERROR" />
            <Button onClick={onTryAgain}>
                <Translation id="TR_TRY_AGAIN" />
            </Button>
        </Wrapper>
    );
};

export default connect(null, mapDispatchToProps)(PinMismatch);
