import { useSelector } from 'react-redux';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { LearnMoreButton } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { selectIsDeviceProtectedByPassphrase } from '@suite-common/device';
import { Switch, Tooltip } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { SectionItem } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';
import { HELP_CENTER_PASSPHRASE_URL } from '@trezor/urls';

import { applySettingsThunk } from '#src/actions/settings/deviceSettingsActions';

interface PassphraseProps {
    isDeviceLocked: boolean;
}

export const Passphrase = ({ isDeviceLocked }: PassphraseProps) => {
    const isDeviceProtectedByPassphrase = useSelector(selectIsDeviceProtectedByPassphrase);
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);

    const handleChange = () => {
        dispatch(applySettingsThunk({ use_passphrase: !isDeviceProtectedByPassphrase }));
        analytics.report({
            type: events.settingsDeviceChangePassphraseProtectionEvent.name,
            payload: {
                use_passphrase: !isDeviceProtectedByPassphrase,
            },
        });
    };

    return (
        <Anchor anchorId={SettingsAnchor.Passphrase}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                    title={<Translation id="TR_DEVICE_SETTINGS_PASSPHRASE_TITLE" />}
                    description={<Translation id="TR_DEVICE_SETTINGS_PASSPHRASE_DESC" />}
                    bottomContent={<LearnMoreButton url={HELP_CENTER_PASSPHRASE_URL} />}
                    actions={
                        <Tooltip
                            isActive={isDeviceLocked}
                            content={
                                <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                            }
                        >
                            <Switch
                                isChecked={isDeviceProtectedByPassphrase}
                                onChange={handleChange}
                                data-testid="@settings/device/passphrase-switch"
                                isDisabled={isDeviceLocked}
                            />
                        </Tooltip>
                    }
                />
            )}
        </Anchor>
    );
};
