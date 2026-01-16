import { useCallback, useState } from 'react';

import { Translation } from '@suite/intl';
import { Column, H3, Modal, Paragraph } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { desktopApi } from '@trezor/suite-desktop-api';
import { spacings } from '@trezor/theme';
import { SUITE_URL } from '@trezor/urls';

interface EarlyAccessDisableProps {
    hideWindow: () => void;
}

export const EarlyAccessDisable = ({ hideWindow }: EarlyAccessDisableProps) => {
    const [enabled, setEnabled] = useState(true);

    const allowPrerelease = useCallback(() => {
        analytics.report({
            type: EventType.SettingsGeneralEarlyAccess,
            payload: {
                allowPrerelease: false,
            },
        });
        desktopApi.allowPrerelease(false);
        setEnabled(false);
    }, []);

    return enabled ? (
        <Modal
            iconName="starFour"
            variant="info"
            onCancel={hideWindow}
            bottomContent={
                <>
                    <Modal.Button onClick={allowPrerelease}>
                        <Translation id="TR_EARLY_ACCESS_DISABLE" />
                    </Modal.Button>
                    <Modal.Button onClick={hideWindow} intent="neutral" priority="secondary">
                        <Translation id="TR_EARLY_ACCESS_STAY_IN" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={spacings.xxs}>
                <H3>
                    <Translation id="TR_EARLY_ACCESS" />
                </H3>
                <Paragraph variant="tertiary" typographyStyle="hint">
                    <Translation id="TR_EARLY_ACCESS_DISABLE_CONFIRM_TITLE" />
                    <br />
                    <Translation id="TR_EARLY_ACCESS_DISABLE_CONFIRM_DESCRIPTION" />
                </Paragraph>
            </Column>
        </Modal>
    ) : (
        <Modal
            iconName="starFour"
            variant="info"
            onCancel={hideWindow}
            bottomContent={
                <>
                    <Modal.Button href={SUITE_URL}>
                        <Translation id="TR_EARLY_ACCESS_REINSTALL" />
                    </Modal.Button>
                    <Modal.Button onClick={hideWindow} intent="neutral" priority="secondary">
                        <Translation id="TR_EARLY_ACCESS_SKIP_REINSTALL" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={spacings.xxs}>
                <H3>
                    <Translation id="TR_EARLY_ACCESS" />
                </H3>
                <Paragraph variant="tertiary" typographyStyle="hint">
                    <Translation id="TR_EARLY_ACCESS_LEFT_TITLE" />
                    <br />
                    <Translation id="TR_EARLY_ACCESS_LEFT_DESCRIPTION" />
                </Paragraph>
            </Column>
        </Modal>
    );
};
