import { isDevicePerceivedAsNew } from '@suite-common/suite-utils';
import { Banner, LoadingContent, Switch, Tooltip } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { HELP_CENTER_LABELING } from '@trezor/urls';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDevice, useDiscovery } from 'src/hooks/suite';

import { useLabelingCombined } from '../../../hooks/suite/useLabelingCombined';

/**
 * @deprecated This will be replaced by LocalFistStorage (Evolu)
 */
export const Labeling = () => {
    const { device, isLocked } = useDevice();
    const { legacyMetadataState, legacyEnable, legacyDisable, isLocalFirstStorageEnabled } =
        useLabelingCombined({ deviceStaticSessionId: device?.state?.staticSessionId });

    const { isDiscoveryRunning } = useDiscovery();

    const handleSwitchClick = () => {
        if (legacyMetadataState.enabled) {
            legacyDisable();
        } else {
            legacyEnable();
        }

        analytics.report({
            type: EventType.SettingsGeneralLabeling,
            payload: {
                value: !legacyMetadataState.enabled,
            },
        });
    };

    // This should ideally not depend on the device so it should never be disabled.
    // But if user have REMEMBERED device DISCONNECTED, he would get to the wrong state where
    // Labeling is turned on in Settings, but not accessible at all and user is not informed
    // what to do to enable it. That is why it's disabled for now in that case.
    //
    // Following use cases need some bigger UX refactoring:
    // - Labeling enabled without any device connected
    // - Labeling enabled with the device connected inside Settings
    // The initialization of Labeling then start when user select a Wallet.

    const newlyConnectedDevice = isDevicePerceivedAsNew(device);
    const isDisabled =
        isLocked() ||
        device?.mode !== 'normal' ||
        !device?.state?.staticSessionId ||
        newlyConnectedDevice;

    const getTooltipContent = () => {
        if (newlyConnectedDevice) {
            return <Translation id="TR_DISABLED_SWITCH_NEW_DEVICE_TOOLTIP" />;
        }

        if (isDiscoveryRunning) {
            return null;
        }

        return <Translation id="TR_DISABLED_SWITCH_TOOLTIP" />;
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.Labeling}>
            <TextColumn
                title={
                    <LoadingContent
                        isLoading={legacyMetadataState.initiating}
                        isSuccessful={legacyMetadataState.enabled}
                    >
                        <Translation id="TR_LABELING_ENABLED" />
                    </LoadingContent>
                }
                description={
                    <>
                        <Translation id="TR_LABELING_FEATURE_ALLOWS" />
                        {isLocalFirstStorageEnabled && (
                            <Banner>
                                <Translation id="LEGACY_LABELING_TURNS_OFF_EVOLU_NOTICE" />
                            </Banner>
                        )}
                    </>
                }
                buttonLink={HELP_CENTER_LABELING}
            />
            <ActionColumn>
                <Tooltip
                    isActive={isDisabled && !isDiscoveryRunning}
                    maxWidth={280}
                    offset={10}
                    placement="top"
                    content={getTooltipContent()}
                >
                    <Switch
                        isDisabled={isDisabled || legacyMetadataState.initiating}
                        data-testid="@settings/metadata-switch"
                        isChecked={legacyMetadataState.enabled}
                        onChange={handleSwitchClick}
                    />
                </Tooltip>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
