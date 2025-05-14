import { useState } from 'react';

import { Card, Checkbox, Column, Modal, Paragraph } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { desktopApi } from '@trezor/suite-desktop-api';
import { spacings } from '@trezor/theme';

import * as modalActions from 'src/actions/suite/modalActions';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch } from 'src/hooks/suite';

export const AutoStartBeforeQuitModal = () => {
    const dispatch = useDispatch();
    const [dontAskAgain, setDontAskAgain] = useState(false);
    if (!desktopApi.available) return null;

    const handleResponse = (
        action: 'background-always' | 'background-now' | 'quit-always' | 'quit-now',
    ) => {
        desktopApi.appAutoStartPopupResponse(action);
        dispatch(modalActions.onCancel());
        analytics.report({
            type: EventType.AutostartModal,
            payload: {
                action,
            },
        });
    };
    const handleBackground = () => {
        handleResponse(dontAskAgain ? 'background-always' : 'background-now');
    };
    const handleQuit = () => {
        handleResponse(dontAskAgain ? 'quit-always' : 'quit-now');
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
                        data-testid="@auto-start-before-quit/button-background"
                    >
                        <Translation id="TR_RUN_IN_BACKGROUND" />
                    </Modal.Button>
                    <Modal.Button
                        onClick={() => handleQuit()}
                        data-testid="@auto-start-before-quit/button-quit"
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
