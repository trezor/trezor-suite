import React from 'react';
import styled from 'styled-components';
import { Button, Image } from '@trezor/components';
import { Translation, Modal, ModalProps } from '@suite-components';

const ImageWrapper = styled.div`
    padding: 60px 0;
`;

const StyledModal = styled(Modal)`
    width: 600px;
`;

interface ConfirmNoBackupProps extends ModalProps {
    onReceiveConfirmation: (confirmed: boolean) => void;
    onCreateBackup: () => void;
}

export const ConfirmNoBackup = ({
    onReceiveConfirmation,
    onCreateBackup,
    ...rest
}: ConfirmNoBackupProps) => (
    <StyledModal
        heading={<Translation id="TR_YOUR_TREZOR_IS_NOT_BACKED_UP" />}
        description={<Translation id="TR_IF_YOUR_DEVICE_IS_EVER_LOST" />}
        bottomBar={
            <>
                <Button
                    variant="secondary"
                    onClick={() => onReceiveConfirmation(true)}
                    data-test="@no-backup/take-risk-button"
                >
                    <Translation id="TR_SHOW_ADDRESS_ANYWAY" />
                </Button>
                <Button
                    onClick={() => {
                        onReceiveConfirmation(false);
                        onCreateBackup();
                    }}
                >
                    <Translation id="TR_CREATE_BACKUP" />
                </Button>
            </>
        }
        {...rest}
    >
        <ImageWrapper>
            <Image image="UNI_ERROR" />
        </ImageWrapper>
    </StyledModal>
);
