import { useState } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { metadataLabelingActions, metadataThunks } from '@suite/metadata';
import { SettingsAnchor } from '@suite/router';
import { SuiteSyncServers } from '@suite/suite-sync';
import { events } from '@suite-common/analytics';
import {
    selectIsSuiteSyncEnabled,
    selectIsSuiteSyncFeatureAvailable,
} from '@suite-common/suite-sync';
import { LoadingContent } from '@trezor/components';
import { ActionColumn, ActionSelect, TextColumn } from '@trezor/product-components';
import { exhaustive } from '@trezor/type-utils';
import { HELP_CENTER_LABELING } from '@trezor/urls';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import {
    LABELING_LEGACY_OPTION_LABEL,
    LABELING_SELECT_OPTIONS,
    type LabelingOption,
    type LabelingOptionTranslated,
    type LabelingSelectValue,
} from 'src/constants/suite/labeling';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { useLabelingDeviceState } from 'src/hooks/suite/useLabelingDeviceState';
import { useSuiteServices } from 'src/support/SuiteServicesProvider';
import { useAnalytics } from 'src/support/useAnalytics';

import { LabelingSwitchToLegacyModal } from '../../../components/suite/labeling/LabelingSwitchToLegacyModal';
import { suiteSyncErrorHandler } from '../../../components/suite/labeling/suiteSyncErrorHandler';

export const Labeling = () => {
    const { translationString } = useTranslation();
    const { suiteSync } = useSuiteServices();
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const [legacyModalWarningVisible, setLegacyModalWarningVisible] = useState(false);
    const { device } = useDevice();
    const deviceStaticSessionId = device?.state?.staticSessionId;
    const { isDeviceLabelingDisabled } = useLabelingDeviceState();

    const showSuiteSync = useSelector(selectIsSuiteSyncFeatureAvailable);
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);

    const legacyMetadataState = useSelector(state => state.metadata);

    const translatedOptions: LabelingOption<string>[] = LABELING_SELECT_OPTIONS.map(option => ({
        ...option,
        label:
            !showSuiteSync && option.value === 'legacy'
                ? translationString(LABELING_LEGACY_OPTION_LABEL)
                : translationString(option.label),
    })).filter(option => option.value !== 'suite-sync' || showSuiteSync);

    const handleLegacyOptionSelect = async () => {
        await suiteSync.turnOffSuiteSync();
        if (legacyMetadataState.enabled === false) {
            dispatch(metadataLabelingActions.init(true));
        }
    };

    const handleOnChange = async (selected: LabelingOptionTranslated) => {
        const { value } = selected;

        // show a warning legacy modal when user selects legacy option while using Suite Sync
        if (value === 'legacy' && isSuiteSyncEnabled) {
            setLegacyModalWarningVisible(true);

            return;
        }

        switch (value) {
            case 'off':
                if (legacyMetadataState.enabled) {
                    dispatch(metadataThunks.disableMetadata());
                }

                await suiteSync.turnOffSuiteSync();
                break;

            case 'suite-sync': {
                const result = await suiteSync.turnOnSuiteSync({ deviceStaticSessionId });
                if (!result.success && deviceStaticSessionId !== undefined) {
                    suiteSyncErrorHandler({ deviceStaticSessionId, dispatch, error: result.error });
                }

                break;
            }

            case 'legacy':
                await handleLegacyOptionSelect();
                break;

            default:
                exhaustive(value);
        }

        analytics.report({
            type: events.settingsGeneralLabelingEvent.name,
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

    const isOptionDisabled = (option: LabelingSelectValue) => {
        switch (option) {
            case 'legacy':
                return isDeviceLabelingDisabled;
            default:
                return false;
        }
    };

    return (
        <>
            {legacyModalWarningVisible && (
                <LabelingSwitchToLegacyModal
                    onClose={() => setLegacyModalWarningVisible(false)}
                    onSwitch={async () => {
                        await handleLegacyOptionSelect();
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
                    bottomContent={<LearnMoreButton url={HELP_CENTER_LABELING} />}
                />
                <ActionColumn>
                    <ActionSelect
                        options={translatedOptions}
                        value={getSelectedOption()}
                        onChange={handleOnChange}
                        data-testid="@settings/labeling-select"
                        isDisabled={isDeviceLabelingDisabled && !showSuiteSync}
                        isOptionDisabled={option => isOptionDisabled(option.value)}
                    />
                </ActionColumn>
            </SettingsSectionItem>
            {isSuiteSyncEnabled && <SuiteSyncServers suiteSync={suiteSync} />}
        </>
    );
};
