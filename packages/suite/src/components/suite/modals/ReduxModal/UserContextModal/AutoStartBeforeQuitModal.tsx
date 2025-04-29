import { useState } from 'react';

import { Card, Checkbox, Column, Modal, Paragraph } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { spacings } from '@trezor/theme';

import * as modalActions from 'src/actions/suite/modalActions';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch } from 'src/hooks/suite';

export const AutoStartBeforeQuitModal = () => {
    const dispatch = useDispatch();
    const [dontAskAgain, setDontAskAgain] = useState(false);
    if (!desktopApi.available) return null;

    const handleBackground = () => {
        desktopApi.appAutoStartPopupResponse(dontAskAgain ? 'background-always' : 'background-now');
        dispatch(modalActions.onCancel());
    };
    const handleQuit = () => {
        desktopApi.appAutoStartPopupResponse(dontAskAgain ? 'quit-always' : 'quit-now');
        dispatch(modalActions.onCancel());
    };

    return (
        <Modal
            data-testid="@auto-start-before-quit"
            variant="primary"
            onCancel={() => handleQuit()}
            heading={<Translation id="TR_RUN_IN_BACKGROUND_TITLE" />}
            bottomContent={
                <>
                    <Modal.Button
                        onClick={() => handleBackground()}
                        data-test="@auto-start-before-quit/button-background"
                    >
                        <Translation id="TR_RUN_IN_BACKGROUND" />
                    </Modal.Button>
                    <Modal.Button
                        onClick={() => handleQuit()}
                        data-test="@auto-start-before-quit/button-quit"
                        variant="tertiary"
                    >
                        <Translation id="TR_QUIT_NOW" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={spacings.md}>
                <Paragraph>
                    <Translation id="TR_RUN_IN_BACKGROUND_DESCRIPTION" />
                </Paragraph>
                <Card>
                    <Checkbox
                        data-testid="auto-start-before-quit/dont-ask-again-checkbox"
                        isChecked={dontAskAgain}
                        onClick={() => setDontAskAgain(!dontAskAgain)}
                    >
                        <Translation id="TR_DONT_ASK_AGAIN" />
                    </Checkbox>
                </Card>
            </Column>
        </Modal>
    );
};
