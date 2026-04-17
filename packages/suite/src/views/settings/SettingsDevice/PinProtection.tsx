import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { Switch, Tooltip } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { changePin } from 'src/actions/settings/deviceSettingsActions';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

interface PinProtectionProps {
    isDeviceLocked: boolean;
}

export const PinProtection = ({ isDeviceLocked }: PinProtectionProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const analytics = useAnalytics();

    const pinProtection = device?.features?.pin_protection ?? null;

    const handleChange = () => {
        dispatch(changePin({ remove: !!pinProtection }));
        analytics.report({
            type: events.settingsDeviceChangePinProtectionEvent.name,
            payload: {
                remove: pinProtection,
            },
        });
    };

    return (
        <Anchor anchorId={SettingsAnchor.PinProtection}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                >
                    <TextColumn
                        title={<Translation id="TR_DEVICE_SETTINGS_PIN_PROTECTION_TITLE" />}
                        description={<Translation id="TR_DEVICE_SETTINGS_PIN_PROTECTION_DESC" />}
                    />
                    <ActionColumn>
                        <Tooltip
                            isActive={isDeviceLocked}
                            content={
                                <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                            }
                        >
                            <Switch
                                isChecked={!!pinProtection}
                                onChange={handleChange}
                                isDisabled={isDeviceLocked}
                                data-testid="@settings/device/pin-switch"
                            />
                        </Tooltip>
                    </ActionColumn>
                </SectionItem>
            )}
        </Anchor>
    );
};
