import React from 'react';
import styled from 'styled-components';

import { onReceiveConfirmation } from '@suite-actions/modalActions';
import { goto } from '@suite-actions/routerActions';
import { Translation, Modal } from '@suite-components';
import { useDispatch } from '@suite-hooks/useDispatch';
import { Button, Image } from '@trezor/components';
import { ReduxModalProps } from '@suite-components/ModalSwitcher/types';
import { TranslationKey } from '@suite-components/Translation';
import { SettingsAnchor } from '@suite-constants/anchors';

const ImageWrapper = styled.div`
    padding: 60px 0px;
`;

const StyledModal = styled(Modal)`
    width: 600px;
`;

interface ConfirmNoBackupProps extends Pick<ReduxModalProps, 'renderer'> {
    buttonText: TranslationKey;
}

export const ConfirmNoBackup = ({ buttonText }: ConfirmNoBackupProps) => {
    const dispatch = useDispatch();

    const confirm = () => dispatch(onReceiveConfirmation(true));
    const close = () => dispatch(onReceiveConfirmation(false));
    const goToSettings = () => {
        close();
        dispatch(goto('settings-device', { anchor: SettingsAnchor.BackupRecoverySeed }));
    };

    return (
        <StyledModal
            isCancelable
            onCancel={close}
            heading={<Translation id="TR_YOUR_TREZOR_IS_NOT_BACKED_UP" />}
            description={<Translation id="TR_IF_YOUR_DEVICE_IS_EVER_LOST" />}
            bottomBar={
                <>
                    <Button
                        variant="secondary"
                        onClick={confirm}
                        data-test="@no-backup/take-risk-button"
                    >
                        <Translation id={buttonText} />
                    </Button>
                    <Button onClick={goToSettings}>
                        <Translation id="TR_CREATE_BACKUP" />
                    </Button>
                </>
            }
        >
            <ImageWrapper>
                <Image image="UNI_ERROR" />
            </ImageWrapper>
        </StyledModal>
    );
};
