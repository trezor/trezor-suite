import { useCallback, useState } from 'react';

import { useTheme } from 'styled-components';

import { SUITE_URL } from '@trezor/urls';
import { analytics, EventType } from '@trezor/suite-analytics';
import { desktopApi } from '@trezor/suite-desktop-api';
import { Button, Column, NewModal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { NewModalIconColors } from '@trezor/components';

import { Translation, TrezorLink } from 'src/components/suite';

interface EarlyAccessDisableProps {
    hideWindow: () => void;
}

export const EarlyAccessDisable = ({ hideWindow }: EarlyAccessDisableProps) => {
    const [enabled, setEnabled] = useState(true);

    const theme = useTheme();

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

    const purpleModalColorBranding: NewModalIconColors = {
        foreground: theme.iconAlertPurple,
        background: theme.backgroundAlertPurpleSubtleOnElevationNegative,
    };

    const eapIconComponent = <NewModal.Icon iconName="eap" iconColor={purpleModalColorBranding} />;

    return enabled ? (
        <NewModal
            iconComponent={eapIconComponent}
            onCancel={hideWindow}
            heading={<Translation id="TR_EARLY_ACCESS" />}
            bottomContent={
                <>
                    <Button onClick={allowPrerelease}>
                        <Translation id="TR_EARLY_ACCESS_DISABLE" />
                    </Button>
                    <Button onClick={hideWindow} variant="tertiary">
                        <Translation id="TR_EARLY_ACCESS_STAY_IN" />
                    </Button>
                </>
            }
        >
            <Column gap={spacings.xs} alignItems="start">
                <Paragraph typographyStyle="highlight">
                    <Translation id="TR_EARLY_ACCESS_DISABLE_CONFIRM_TITLE" />
                </Paragraph>
                <Paragraph variant="tertiary">
                    <Translation id="TR_EARLY_ACCESS_DISABLE_CONFIRM_DESCRIPTION" />
                </Paragraph>
            </Column>
        </NewModal>
    ) : (
        <NewModal
            iconComponent={eapIconComponent}
            onCancel={hideWindow}
            heading={<Translation id="TR_EARLY_ACCESS" />}
            bottomContent={
                <>
                    <TrezorLink variant="nostyle" href={SUITE_URL}>
                        <Button icon="arrowUpRight" iconAlignment="right" variant="primary">
                            <Translation id="TR_EARLY_ACCESS_REINSTALL" />
                        </Button>
                    </TrezorLink>
                    <Button onClick={hideWindow} variant="tertiary">
                        <Translation id="TR_EARLY_ACCESS_SKIP_REINSTALL" />
                    </Button>
                </>
            }
        >
            <Column gap={spacings.xs} alignItems="start">
                <Paragraph typographyStyle="highlight">
                    <Translation id="TR_EARLY_ACCESS_LEFT_TITLE" />
                </Paragraph>
                <Paragraph variant="tertiary">
                    <Translation id="TR_EARLY_ACCESS_LEFT_DESCRIPTION" />
                </Paragraph>
            </Column>
        </NewModal>
    );
};
