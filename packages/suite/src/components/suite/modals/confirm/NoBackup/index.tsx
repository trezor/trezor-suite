import { Translation, Image, Modal, ModalProps } from '@suite-components';
import { Button } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';

const ImageWrapper = styled.div`
    padding: 60px 0px;
`;

const Actions = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`;

interface Props extends ModalProps {
    onReceiveConfirmation: (confirmed: boolean) => void;
    onCreateBackup: () => void;
}

const ConfirmNoBackup = ({ onReceiveConfirmation, onCreateBackup, ...rest }: Props) => (
    <Modal
        size="small"
        heading={<Translation id="TR_YOUR_TREZOR_IS_NOT_BACKED_UP" />}
        description={<Translation id="TR_IF_YOUR_DEVICE_IS_EVER_LOST" />}
        {...rest}
    >
        <ImageWrapper>
            <Image image="HOLOGRAM_WARNING" />
        </ImageWrapper>
        <Actions>
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
        </Actions>
    </Modal>
);

export default ConfirmNoBackup;
