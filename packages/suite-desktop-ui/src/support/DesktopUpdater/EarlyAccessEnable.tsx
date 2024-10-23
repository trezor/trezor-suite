import { useCallback, useState } from 'react';

import { useTheme } from 'styled-components';

import { analytics, EventType } from '@trezor/suite-analytics';
import { desktopApi } from '@trezor/suite-desktop-api';
import {
    Button,
    Paragraph,
    Tooltip,
    NewModal,
    Card,
    Column,
    IconCircleColors,
    IconCircle,
} from '@trezor/components';
import { spacings } from '@trezor/theme';

import { CheckItem, Translation } from 'src/components/suite';

interface EarlyAccessEnableProps {
    hideWindow: () => void;
}

export const EarlyAccessEnable = ({ hideWindow }: EarlyAccessEnableProps) => {
    const [understood, setUnderstood] = useState(false);
    const [enabled, setEnabled] = useState(false);

    const theme = useTheme();

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

    const purpleModalColorBranding: IconCircleColors = {
        foreground: theme.iconAlertPurple,
        background: theme.backgroundAlertPurpleSubtleOnElevationNegative,
    };

    const eapIconComponent = (
        <IconCircle name="eap" iconColor={purpleModalColorBranding} size={40} />
    );

    return enabled ? (
        <NewModal
            iconComponent={eapIconComponent}
            heading={<Translation id="TR_EARLY_ACCESS_JOINED_TITLE" />}
            onCancel={hideWindow}
            bottomContent={
                <>
                    <Button onClick={checkForUpdates}>
                        <Translation id="TR_EARLY_ACCESS_CHECK_UPDATE" />
                    </Button>
                    <Button
                        onClick={hideWindow}
                        variant="tertiary"
                        data-testid="@settings/early-access-skip-button"
                    >
                        <Translation id="TR_EARLY_ACCESS_SKIP_CHECK" />
                    </Button>
                </>
            }
        >
            <Translation id="TR_EARLY_ACCESS_JOINED_DESCRIPTION" />
        </NewModal>
    ) : (
        <NewModal
            iconComponent={eapIconComponent}
            heading={<Translation id="TR_EARLY_ACCESS" />}
            onCancel={hideWindow}
            bottomContent={
                <Tooltip
                    maxWidth={285}
                    content={
                        !understood && <Translation id="TR_EARLY_ACCESS_ENABLE_CONFIRM_TOOLTIP" />
                    }
                >
                    <Button
                        variant="primary"
                        onClick={allowPrerelease}
                        isDisabled={!understood}
                        data-testid="@settings/early-access-confirm-button"
                    >
                        <Translation id="TR_EARLY_ACCESS_ENABLE_CONFIRM" />
                    </Button>
                </Tooltip>
            }
        >
            <Column gap={spacings.xs} alignItems="start">
                <Paragraph typographyStyle="highlight">
                    <Translation id="TR_EARLY_ACCESS_ENABLE_CONFIRM_TITLE" />
                </Paragraph>
                <Paragraph variant="tertiary">
                    <Translation id="TR_EARLY_ACCESS_ENABLE_CONFIRM_DESCRIPTION" />
                </Paragraph>

                <Card>
                    <CheckItem
                        data-testid="@settings/early-access-confirm-check"
                        title={<Translation id="TR_EARLY_ACCESS_ENABLE_CONFIRM_CHECK" />}
                        description=""
                        isChecked={understood}
                        onClick={() => setUnderstood(!understood)}
                    />
                </Card>
            </Column>
        </NewModal>
    );
};
