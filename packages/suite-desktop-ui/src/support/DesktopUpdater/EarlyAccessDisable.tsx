import { useCallback, useState } from 'react';

import { SUITE_URL } from '@trezor/urls';
import { analytics, EventType } from '@trezor/suite-analytics';
import { desktopApi } from '@trezor/suite-desktop-api';
import { NewModal, Paragraph, H3, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation, TrezorLink } from 'src/components/suite';

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
        <NewModal
            iconName="eap"
            variant="info"
            onCancel={hideWindow}
            bottomContent={
                <>
                    <NewModal.Button onClick={allowPrerelease}>
                        <Translation id="TR_EARLY_ACCESS_DISABLE" />
                    </NewModal.Button>
                    <NewModal.Button onClick={hideWindow} variant="tertiary">
                        <Translation id="TR_EARLY_ACCESS_STAY_IN" />
                    </NewModal.Button>
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
        </NewModal>
    ) : (
        <NewModal
            iconName="eap"
            variant="info"
            onCancel={hideWindow}
            bottomContent={
                <>
                    <TrezorLink variant="nostyle" href={SUITE_URL}>
                        <NewModal.Button icon="arrowUpRight" iconAlignment="right">
                            <Translation id="TR_EARLY_ACCESS_REINSTALL" />
                        </NewModal.Button>
                    </TrezorLink>
                    <NewModal.Button onClick={hideWindow} variant="tertiary">
                        <Translation id="TR_EARLY_ACCESS_SKIP_REINSTALL" />
                    </NewModal.Button>
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
        </NewModal>
    );
};
