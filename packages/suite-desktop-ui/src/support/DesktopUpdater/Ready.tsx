import { Button, NewModal, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { installUpdate } from 'src/actions/suite/desktopUpdateActions';

interface ReadyProps {
    hideWindow: () => void;
}

export const Ready = ({ hideWindow }: ReadyProps) => {
    const dispatch = useDispatch();

    const install = () => dispatch(installUpdate({ shouldInstallOnQuit: false }));
    const installOnQuit = () => {
        dispatch(installUpdate({ shouldInstallOnQuit: true }));
        hideWindow();
    };

    return (
        <NewModal
            heading={<Translation id="TR_UPDATE_MODAL_UPDATE_DOWNLOADED" />}
            onCancel={installOnQuit}
            bottomContent={
                <Row gap={spacings.xs}>
                    <Button onClick={installOnQuit} variant="tertiary">
                        <Translation id="TR_UPDATE_MODAL_UPDATE_ON_QUIT" />
                    </Button>
                    <Button onClick={install} variant="primary">
                        <Translation id="TR_UPDATE_MODAL_INSTALL_AND_RESTART" />
                    </Button>
                </Row>
            }
        >
            <Paragraph typographyStyle="highlight" variant="primary">
                <Translation id="TR_UPDATE_MODAL_INSTALL_NOW_OR_LATER" />
            </Paragraph>
            <Paragraph>
                <Translation id="TR_UPDATE_MODAL_RESTART_NEEDED" />
            </Paragraph>
        </NewModal>
    );
};
