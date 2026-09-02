import { installUpdateThunk } from '@suite/desktop-update';
import { Translation } from '@suite/intl';
import { useDispatch } from '@suite-common/redux-utils';
import { Column, H3, Modal, Paragraph } from '@trezor/components';
import { DownloadIcon } from '@trezor/icons';

interface ReadyProps {
    hideWindow: () => void;
}

export const Ready = ({ hideWindow }: ReadyProps) => {
    const dispatch = useDispatch();

    const install = () => dispatch(installUpdateThunk({ installNow: true }));
    const installOnQuit = () => {
        dispatch(installUpdateThunk({ installNow: false }));
        hideWindow();
    };

    return (
        <Modal
            onCancel={installOnQuit}
            icon={DownloadIcon}
            bottomContent={
                <>
                    <Modal.Button onClick={install}>
                        <Translation id="TR_UPDATE_MODAL_INSTALL_AND_RESTART" />
                    </Modal.Button>
                    <Modal.Button onClick={installOnQuit} intent="neutral" priority="secondary">
                        <Translation id="TR_UPDATE_MODAL_UPDATE_ON_QUIT" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={4}>
                <H3>
                    <Translation id="TR_UPDATE_MODAL_UPDATE_DOWNLOADED" />
                </H3>
                <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                    <Translation id="TR_UPDATE_MODAL_INSTALL_NOW_OR_LATER" />{' '}
                    <Translation id="TR_UPDATE_MODAL_RESTART_NEEDED" />
                </Paragraph>
            </Column>
        </Modal>
    );
};
