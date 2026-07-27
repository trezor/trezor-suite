import { useCallback, useState } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { Card, Column, H3, Modal, Paragraph, Tooltip } from '@trezor/components';
import { StarFourIcon } from '@trezor/icons';
import { desktopApi } from '@trezor/suite-desktop-api';

import { CheckItem } from 'src/components/suite';

interface EarlyAccessEnableProps {
    hideWindow: () => void;
}

export const EarlyAccessEnable = ({ hideWindow }: EarlyAccessEnableProps) => {
    const [understood, setUnderstood] = useState(false);
    const [enabled, setEnabled] = useState(false);
    const { analytics } = useServices(selectDesktopAnalyticsDep);
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
            icon={StarFourIcon}
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
            <Column gap={4}>
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
            icon={StarFourIcon}
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
            <Column gap={4}>
                <H3>
                    <Translation id="TR_EARLY_ACCESS" />
                </H3>
                <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                    <Translation id="TR_EARLY_ACCESS_ENABLE_CONFIRM_TITLE" />
                    <br />
                    <Translation id="TR_EARLY_ACCESS_ENABLE_CONFIRM_DESCRIPTION" />
                </Paragraph>
            </Column>
            <Card margin={{ top: 24 }}>
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
