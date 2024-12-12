import { useCallback, useState } from 'react';

import { analytics, EventType } from '@trezor/suite-analytics';
import { desktopApi } from '@trezor/suite-desktop-api';
import { Paragraph, Tooltip, NewModal, H3, Column, Card } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { CheckItem, Translation } from 'src/components/suite';

interface EarlyAccessEnableProps {
    hideWindow: () => void;
}

export const EarlyAccessEnable = ({ hideWindow }: EarlyAccessEnableProps) => {
    const [understood, setUnderstood] = useState(false);
    const [enabled, setEnabled] = useState(false);

    const allowPrerelease = useCallback(() => {
        analytics.report({
            type: EventType.SettingsGeneralEarlyAccess,
            payload: {
                allowPrerelease: true,
            },
        });
        desktopApi.allowPrerelease(true);
        setEnabled(true);
    }, []);

    const checkForUpdates = useCallback(() => desktopApi.checkForUpdates(true), []);

    return enabled ? (
        <NewModal
            iconName="eap"
            variant="info"
            onCancel={hideWindow}
            bottomContent={
                <>
                    <NewModal.Button onClick={checkForUpdates}>
                        <Translation id="TR_EARLY_ACCESS_CHECK_UPDATE" />
                    </NewModal.Button>
                    <NewModal.Button
                        onClick={hideWindow}
                        variant="tertiary"
                        data-testid="@settings/early-access-skip-button"
                    >
                        <Translation id="TR_EARLY_ACCESS_SKIP_CHECK" />
                    </NewModal.Button>
                </>
            }
        >
            <Column gap={spacings.xxs}>
                <H3>
                    <Translation id="TR_EARLY_ACCESS_JOINED_TITLE" />
                </H3>
                <Paragraph variant="tertiary" typographyStyle="hint">
                    <Translation id="TR_EARLY_ACCESS_JOINED_DESCRIPTION" />
                </Paragraph>
            </Column>
        </NewModal>
    ) : (
        <NewModal
            iconName="eap"
            variant="info"
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
                        <NewModal.Button
                            onClick={allowPrerelease}
                            isDisabled={!understood}
                            data-testid="@settings/early-access-confirm-button"
                        >
                            <Translation id="TR_EARLY_ACCESS_ENABLE_CONFIRM" />
                        </NewModal.Button>
                    </Tooltip>
                    <NewModal.Button variant="tertiary" onClick={hideWindow}>
                        <Translation id="TR_CANCEL" />
                    </NewModal.Button>
                </>
            }
        >
            <Column gap={spacings.xxs}>
                <H3>
                    <Translation id="TR_EARLY_ACCESS" />
                </H3>
                <Paragraph variant="tertiary" typographyStyle="hint">
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
        </NewModal>
    );
};
