import { NewModal, Paragraph, H3, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { installUpdate } from 'src/actions/suite/desktopUpdateActions';

interface ReadyProps {
    hideWindow: () => void;
}

export const Ready = ({ hideWindow }: ReadyProps) => {
    const dispatch = useDispatch();

    const install = () => dispatch(installUpdate({ installNow: true }));
    const installOnQuit = () => {
        dispatch(installUpdate({ installNow: false }));
        hideWindow();
    };

    return (
        <NewModal
            onCancel={installOnQuit}
            iconName="download"
            bottomContent={
                <>
                    <NewModal.Button onClick={install}>
                        <Translation id="TR_UPDATE_MODAL_INSTALL_AND_RESTART" />
                    </NewModal.Button>
                    <NewModal.Button onClick={installOnQuit} variant="tertiary">
                        <Translation id="TR_UPDATE_MODAL_UPDATE_ON_QUIT" />
                    </NewModal.Button>
                </>
            }
        >
            <Column gap={spacings.xxs}>
                <H3>
                    <Translation id="TR_UPDATE_MODAL_UPDATE_DOWNLOADED" />
                </H3>
                <Paragraph variant="tertiary" typographyStyle="hint">
                    <Translation id="TR_UPDATE_MODAL_INSTALL_NOW_OR_LATER" />{' '}
                    <Translation id="TR_UPDATE_MODAL_RESTART_NEEDED" />
                </Paragraph>
            </Column>
        </NewModal>
    );
};
