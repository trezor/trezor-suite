import { useCallback, useState } from 'react';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { Card, Column, H3, Modal, Paragraph, Tooltip } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { spacings } from '@trezor/theme';

import { CheckItem } from 'src/components/suite';
import { useAnalytics } from 'src/support/useAnalytics';

interface EarlyAccessEnableProps {
    hideWindow: () => void;
}

export const EarlyAccessEnable = ({ hideWindow }: EarlyAccessEnableProps) => {
    const [understood, setUnderstood] = useState(false);
    const [enabled, setEnabled] = useState(false);
    const analytics = useAnalytics();
    const allowPrerelease = useCallback(() => {
        analytics.report({
            type: events.settingsGeneralEarlyAccessEvent.name,
            payload: {
                allowPrerelease: true,
            },
        });
        desktopApi.allowPrerelease(true);
        setEnabled(true);
    }, [analytics]);

    const checkForUpdates = useCallback(() => desktopApi.checkForUpdates({ isManual: true }), []);

    return enabled ? (
        <Modal
            iconName="starFour"
            intent="info"
            onCancel={hideWindow}
            bottomContent={
                <>
                    <Modal.Button onClick={checkForUpdates}>
                        <Translation id="TR_EARLY_ACCESS_CHECK_UPDATE" />
                    </Modal.Button>
                    <Modal.Button
                        onClick={hideWindow}
                        intent="neutral"
                        priority="secondary"
                        data-testid="@settings/early-access-skip-button"
                    >
                        <Translation id="TR_EARLY_ACCESS_SKIP_CHECK" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={spacings.xxs}>
                <H3>
                    <Translation id="TR_EARLY_ACCESS_JOINED_TITLE" />
                </H3>
                <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                    <Translation id="TR_EARLY_ACCESS_JOINED_DESCRIPTION" />
                </Paragraph>
            </Column>
        </Modal>
    ) : (
        <Modal
            iconName="starFour"
            intent="info"
            onCancel={hideWindow}
            bottomContent={
                <>
                    <Tooltip
                        maxWidth={285}
                        content={
                            !understood && (
                                <Translation id="TR_EARLY_ACCESS_ENABLE_CONFIRM_TOOLTIP" />
                            )
                        }
                    >
                        <Modal.Button
                            onClick={allowPrerelease}
                            isDisabled={!understood}
                            data-testid="@settings/early-access-confirm-button"
                        >
                            <Translation id="TR_EARLY_ACCESS_ENABLE_CONFIRM" />
                        </Modal.Button>
                    </Tooltip>
                    <Modal.Button intent="neutral" priority="secondary" onClick={hideWindow}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={spacings.xxs}>
                <H3>
                    <Translation id="TR_EARLY_ACCESS" />
                </H3>
                <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                    <Translation id="TR_EARLY_ACCESS_ENABLE_CONFIRM_TITLE" />
                    <br />
                    <Translation id="TR_EARLY_ACCESS_ENABLE_CONFIRM_DESCRIPTION" />
                </Paragraph>
            </Column>
            <Card margin={{ top: spacings.xl }}>
                <CheckItem
                    data-testid="@settings/early-access-confirm-check"
                    title={<Translation id="TR_EARLY_ACCESS_ENABLE_CONFIRM_CHECK" />}
                    description=""
                    isChecked={understood}
                    onClick={() => setUnderstood(!understood)}
                />
            </Card>
        </Modal>
    );
};
