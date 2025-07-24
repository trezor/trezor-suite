import { useState } from 'react';

import { Banner, Card, Column, H3, Modal } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { spacings } from '@trezor/theme';

import { setDebugMode } from 'src/actions/suite/suiteActions';
import { CheckItem, Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

type TurnOnDebugModeModalProps = {
    onCancel: () => void;
};

export const TurnOnDebugModeModal = ({ onCancel }: TurnOnDebugModeModalProps) => {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const dispatch = useDispatch();

    const handleTurningOnDebugMode = () => {
        dispatch(setDebugMode({ showDebugMenu: true }));

        if (desktopApi.available) {
            desktopApi.configLogger({
                level: 'debug',
                options: { writeToDisk: true },
            });
        }

        onCancel();
    };

    return (
        <Modal
            // Intentionally no backdrop click, because this modal is turned on by repeated clicks on header,
            // and a next click would close the modal
            iconName="shieldWarning"
            size="small"
            bottomContent={
                <>
                    <Modal.Button
                        onClick={handleTurningOnDebugMode}
                        isDisabled={!isConfirmed}
                        data-testid="@debug-mode-dialog/turn-on-button"
                    >
                        <Translation id="TR_TURN_ON_DEBUG_MODE_MODAL_BUTTON" />
                    </Modal.Button>
                    <Modal.Button variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
            variant="warning"
        >
            <H3>
                <Translation id="TR_TURN_ON_DEBUG_MODE_TITLE" />
            </H3>
            <Column gap={spacings.sm} margin={{ top: spacings.xl }} alignItems="center">
                <Banner icon="warningFilled">
                    <Translation id="TR_TURN_ON_DEBUG_MODE_MODAL_DESCRIPTION_1" />
                </Banner>
            </Column>
            <Card margin={{ top: spacings.lg }}>
                <CheckItem
                    title={<Translation id="TR_READ_AND_UNDERSTOOD" />}
                    isChecked={isConfirmed}
                    onClick={() => setIsConfirmed(!isConfirmed)}
                    data-testid="@debug-mode-dialog/checkbox"
                />
            </Card>
        </Modal>
    );
};
