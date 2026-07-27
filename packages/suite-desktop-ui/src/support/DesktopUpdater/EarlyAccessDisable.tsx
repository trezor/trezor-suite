import { useCallback, useState } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { Column, H3, Modal, Paragraph } from '@trezor/components';
import { StarFourIcon } from '@trezor/icons';
import { desktopApi } from '@trezor/suite-desktop-api';
import { SUITE_URL } from '@trezor/urls';

interface EarlyAccessDisableProps {
    hideWindow: () => void;
}

export const EarlyAccessDisable = ({ hideWindow }: EarlyAccessDisableProps) => {
    const [enabled, setEnabled] = useState(true);
    const { analytics } = useServices(selectDesktopAnalyticsDep);

    const allowPrerelease = useCallback(() => {
        analytics.report({
            type: events.settingsGeneralEarlyAccessEvent.name,
            payload: {
                allowPrerelease: false,
            },
        });
        desktopApi.allowPrerelease(false);
        setEnabled(false);
    }, [analytics]);

    return enabled ? (
        <Modal
            icon={StarFourIcon}
            intent="info"
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
            <Column gap={4}>
                <H3>
                    <Translation id="TR_EARLY_ACCESS" />
                </H3>
                <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                    <Translation id="TR_EARLY_ACCESS_DISABLE_CONFIRM_TITLE" />
                    <br />
                    <Translation id="TR_EARLY_ACCESS_DISABLE_CONFIRM_DESCRIPTION" />
                </Paragraph>
            </Column>
        </Modal>
    ) : (
        <Modal
            icon={StarFourIcon}
            intent="info"
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
            <Column gap={4}>
                <H3>
                    <Translation id="TR_EARLY_ACCESS" />
                </H3>
                <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                    <Translation id="TR_EARLY_ACCESS_LEFT_TITLE" />
                    <br />
                    <Translation id="TR_EARLY_ACCESS_LEFT_DESCRIPTION" />
                </Paragraph>
            </Column>
        </Modal>
    );
};
