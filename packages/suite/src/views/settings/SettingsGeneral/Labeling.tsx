import { useState } from 'react';

import { EventType } from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
import {
    selectIsFeatureSuiteSyncAvailable,
    selectIsSuiteSyncEnabled,
} from '@suite-common/suite-sync';
import { notificationsActions } from '@suite-common/toast-notifications';
import { LoadingContent } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';
import { HELP_CENTER_LABELING } from '@trezor/urls';

import * as metadataLabelingActions from 'src/actions/suite/metadata/metadataLabelingActions';
import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { ActionColumn, ActionSelect, TextColumn } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import {
    LABELING_LEGACY_OPTION_LABEL,
    LABELING_SELECT_OPTIONS,
    LabelingOption,
    LabelingOptionTranslated,
    LabelingSelectValue,
} from 'src/constants/suite/labeling';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { useLabelingDeviceState } from 'src/hooks/suite/useLabelingDeviceState';
import { useSuiteServices } from 'src/support/SuiteServicesProvider';
import { useAnalytics } from 'src/support/useAnalytics';

import { updateShowEnableSuiteSyncModal } from '../../../actions/suiteSync/suiteSyncSlice';
import { LabelingSwitchToLegacyModal } from '../../../components/suite/labeling/LabelingSwitchToLegacyModal';

export const Labeling = () => {
    const { translationString } = useTranslation();
    const { suiteSync, disableLegacyMetadataIfNeeded } = useSuiteServices();
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const [legacyModalWarningVisible, setLegacyModalWarningVisible] = useState(false);
    const { device } = useDevice();
    const deviceStaticSessionId = device?.state?.staticSessionId;
    const { isDeviceLabelingDisabled } = useLabelingDeviceState();

    const showSuiteSync = useSelector(selectIsFeatureSuiteSyncAvailable);
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);

    const legacyMetadataState = useSelector(state => state.metadata);

    if (deviceStaticSessionId === undefined) {
        return null;
    }
    const legacyEnableIfNeeded = () => {
        if (!legacyMetadataState.enabled) {
            suiteSync.turnOffSuiteSync(); // Enabling Legacy Labeling implicitly disables Evolu
            dispatch(metadataLabelingActions.init(true));
        }
    };

    const translatedOptions: LabelingOption<string>[] = LABELING_SELECT_OPTIONS.map(option => ({
        ...option,
        label:
            !showSuiteSync && option.value === 'legacy'
                ? translationString(LABELING_LEGACY_OPTION_LABEL)
                : translationString(option.label),
    }));

    const handleOnChange = async (selected: LabelingOptionTranslated) => {
        const { value } = selected;

        // show a warning legacy modal when user selects legacy option while using Suite Sync
        if (value === 'legacy' && isSuiteSyncEnabled) {
            setLegacyModalWarningVisible(true);

            return;
        }

        switch (value) {
            case 'off':
                disableLegacyMetadataIfNeeded();
                suiteSync.turnOffSuiteSync();
                break;

            case 'suite-sync': {
                const result = await suiteSync.turnOnSuiteSync({ deviceStaticSessionId });
                if (!result.success) {
                    const { type } = result.error;
                    switch (type) {
                        case 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType':
                            dispatch(updateShowEnableSuiteSyncModal({ deviceStaticSessionId }));

                            return;
                        case 'SuiteSyncUnavailableOnDeviceError':
                        case 'DeviceCancelled':
                        case 'DeviceError':
                            dispatch(notificationsActions.addToast({ type: 'error', error: type }));

                            return;
                        default:
                            return exhaustive(type);
                    }
                }

                break;
            }

            case 'legacy':
                suiteSync.turnOffSuiteSync();
                legacyEnableIfNeeded();
                break;

            default:
                exhaustive(value);
        }

        analytics.report({
            type: EventType.SettingsGeneralLabeling,
            payload: {
                value,
            },
        });
    };

    const getSelectedOption = () => {
        const LABELING_SELECT_TRANSLATED_OPTIONS_MAP = translatedOptions.reduce(
            (acc, option) => {
                acc[option.value] = option;

                return acc;
            },
            {} as Record<LabelingSelectValue, LabelingOption<string>>,
        );

        if (showSuiteSync) {
            if (isSuiteSyncEnabled) return LABELING_SELECT_TRANSLATED_OPTIONS_MAP['suite-sync'];
            if (legacyMetadataState.enabled) return LABELING_SELECT_TRANSLATED_OPTIONS_MAP.legacy;

            return LABELING_SELECT_TRANSLATED_OPTIONS_MAP.off;
        }

        return legacyMetadataState.enabled
            ? {
                  ...LABELING_SELECT_TRANSLATED_OPTIONS_MAP.legacy,
                  label: translationString(LABELING_LEGACY_OPTION_LABEL),
              }
            : LABELING_SELECT_TRANSLATED_OPTIONS_MAP.off;
    };

    return (
        <>
            {legacyModalWarningVisible && (
                <LabelingSwitchToLegacyModal
                    onClose={() => setLegacyModalWarningVisible(false)}
                    onSwitch={() => {
                        suiteSync.turnOffSuiteSync();
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
                        options={translatedOptions}
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
