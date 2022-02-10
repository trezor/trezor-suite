import React from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { Translation, Image, Modal, ModalProps } from '@suite-components';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { useActions } from '@suite-hooks';

const StyledImage = styled(Image)`
    margin: 48px auto;
`;

const PinMismatch = (props: ModalProps) => {
    const { changePin } = useActions({ changePin: deviceSettingsActions.changePin });
    const onTryAgain = () => {
        changePin({});
    };

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
