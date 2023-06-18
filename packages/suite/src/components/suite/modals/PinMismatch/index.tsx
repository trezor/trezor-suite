import React from 'react';
import styled from 'styled-components';
import { Button, Image } from '@trezor/components';
import { Translation, Modal, ModalProps } from 'src/components/suite';
import * as deviceSettingsActions from 'src/actions/settings/deviceSettingsActions';
import { useActions } from 'src/hooks/suite';

const StyledImage = styled(Image)`
    margin: 48px auto;
`;

const StyledModal = styled(Modal)`
    width: 360px;
`;

export const PinMismatch = (props: ModalProps) => {
    const { changePin } = useActions({ changePin: deviceSettingsActions.changePin });
    const onTryAgain = () => {
        changePin({});
    };

    return (
        <StyledModal
            // need to pass props when cloning this inside nested modal
            {...props}
            heading={<Translation id="TR_PIN_MISMATCH_HEADING" />}
            data-test="@pin-mismatch"
        >
            <StyledImage image="UNI_ERROR" />
            <Button onClick={onTryAgain} data-test="@pin-mismatch/try-again-button">
                <Translation id="TR_TRY_AGAIN" />
            </Button>
        </StyledModal>
    );
};
