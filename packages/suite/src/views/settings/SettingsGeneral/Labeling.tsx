import { useState } from 'react';

import { LoadingContent } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { HELP_CENTER_LABELING } from '@trezor/urls';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { ActionColumn, ActionSelect, TextColumn } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import type { ActionSelectOption } from 'src/components/suite/section/sectionStyles';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import {
    EXPERIMENT_LABELING_SELECT_OPTIONS,
    LABELING_OPTIONS,
    LABELING_SELECT_OPTIONS,
} from 'src/constants/suite/labeling';
import { useDevice } from 'src/hooks/suite';
import { useLabelingCombined } from 'src/hooks/suite/useLabelingCombined';
import { useLabelingDeviceState } from 'src/hooks/suite/useLabelingDeviceState';

import { LabelingSwitchToLegacyModal } from '../../../components/suite/labeling/LabelingSwitchToLegacyModal';

export const Labeling = () => {
    const [legacyModalWarningVisible, setLegacyModalWarningVisible] = useState(false);
    const { device } = useDevice();
    const { isDeviceLabelingDisabled } = useLabelingDeviceState();

    const {
        legacyMetadataState,
        legacyEnableIfNeeded,
        legacyDisableIfNeeded,
        localFirstDisableIfNeeded,
        localFirstEnableIfNeeded,
        showLocalFirstStorage,
        isEvoluSupportedByDevice,
        isLocalFirstStorageEnabled,
    } = useLabelingCombined({
        deviceStaticSessionId: device?.state?.staticSessionId,
    });

    const handleOnChange = (selected: ActionSelectOption) => {
        const { value } = selected;

        // show a warning legacy modal when user selects legacy option while using local first storage
        if (selected === LABELING_OPTIONS.LEGACY && isLocalFirstStorageEnabled) {
            setLegacyModalWarningVisible(true);

            return;
        }

        switch (value) {
            case LABELING_OPTIONS.OFF.value:
                legacyDisableIfNeeded();
                localFirstDisableIfNeeded();
                break;

            case LABELING_OPTIONS.ON.value:
                legacyEnableIfNeeded();
                break;

            case LABELING_OPTIONS.SECURE_SYNC.value:
                localFirstEnableIfNeeded();
                break;

            case LABELING_OPTIONS.LEGACY.value:
                localFirstDisableIfNeeded();
                legacyEnableIfNeeded();
                break;

            default:
                break;
        }

        analytics.report({
            type: EventType.SettingsGeneralLabeling,
            payload: {
                value,
            },
        });
    };

    const getSelectedOption = (): ActionSelectOption => {
        if (showLocalFirstStorage) {
            if (isLocalFirstStorageEnabled) return LABELING_OPTIONS.SECURE_SYNC;
            if (legacyMetadataState.enabled) return LABELING_OPTIONS.LEGACY;

            return LABELING_OPTIONS.OFF;
        }

        return legacyMetadataState.enabled ? LABELING_OPTIONS.ON : LABELING_OPTIONS.OFF;
    };

    return (
        <>
            {legacyModalWarningVisible && (
                <LabelingSwitchToLegacyModal
                    onClose={() => setLegacyModalWarningVisible(false)}
                    onSwitch={() => {
                        localFirstDisableIfNeeded();
                        legacyEnableIfNeeded();
                        setLegacyModalWarningVisible(false);
                    }}
                />
            )}

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
                    description={<Translation id="TR_LABELING_FEATURE_ALLOWS" />}
                    buttonLink={HELP_CENTER_LABELING}
                />
                <ActionColumn>
                    <ActionSelect
                        options={
                            showLocalFirstStorage && isEvoluSupportedByDevice
                                ? EXPERIMENT_LABELING_SELECT_OPTIONS
                                : LABELING_SELECT_OPTIONS
                        }
                        value={getSelectedOption()}
                        onChange={handleOnChange}
                        data-testid="@settings/labeling-select"
                        isDisabled={isDeviceLabelingDisabled}
                    />
                </ActionColumn>
            </SettingsSectionItem>
        </>
    );
};
