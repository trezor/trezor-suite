import styled from 'styled-components';

import { onReceiveConfirmation } from 'src/actions/suite/modalActions';
import { goto } from 'src/actions/suite/routerActions';
import { Translation, Modal } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { Button, Image } from '@trezor/components';
import { SettingsAnchor } from 'src/constants/suite/anchors';

const ImageWrapper = styled.div`
    padding: 60px 0px;
`;

const StyledModal = styled(Modal)`
    width: 600px;
`;

export const NoBackupModal = () => {
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
            bottomBarComponents={
                <>
                    <Button
                        variant="secondary"
                        onClick={confirm}
                        data-test="@no-backup/take-risk-button"
                    >
                        <Translation id="TR_CONTINUE_ANYWAY" />
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
