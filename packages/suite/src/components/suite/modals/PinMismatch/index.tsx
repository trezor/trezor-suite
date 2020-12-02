import React, { useState } from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { Translation, Loading, Image, Modal, ModalProps } from '@suite-components';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { useActions } from '@suite-hooks';

const StyledImage = styled(Image)`
    margin: 12px 0px;
    max-height: 160px;
`;

const PinMismatch = (props: ModalProps) => {
    const [submitted, setSubmitted] = useState(false);
    const { changePin } = useActions({ changePin: deviceSettingsActions.changePin });
    const onTryAgain = () => {
        setSubmitted(true);
        changePin({});
    };

    if (submitted) {
        return <Loading />;
    }

    return (
        <Modal
            // need to pass props when cloning this inside nested modal
            {...props}
            size="tiny"
            heading={<Translation id="TR_PIN_MISMATCH_HEADING" />}
            description={<Translation id="TR_PIN_MISMATCH_TEXT" />}
            data-test="@pin-mismatch"
        >
            <StyledImage image="UNI_ERROR" />
            <Button onClick={onTryAgain} data-test="@pin-mismatch/try-again-button">
                <Translation id="TR_TRY_AGAIN" />
            </Button>
        </Modal>
    );
};

export default PinMismatch;
