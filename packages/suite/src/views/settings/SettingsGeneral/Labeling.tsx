import { useState } from 'react';

import { selectIsFeatureLocalFirstStorageAvailable } from '@suite-common/local-first-storage';
import { LoadingContent } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { exhaustive } from '@trezor/type-utils';
import { HELP_CENTER_LABELING } from '@trezor/urls';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { ActionColumn, ActionSelect, TextColumn } from 'src/components/suite';
import { Translation, TranslationKey } from 'src/components/suite/Translation';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import {
    LABELING_LEGACY_OPTION_LABEL,
    LABELING_SELECT_OPTIONS,
    LabelingOption,
    LabelingOptionTranslated,
    LabelingSelectValue,
} from 'src/constants/suite/labeling';
import { useDevice, useSelector, useTranslation } from 'src/hooks/suite';
import { useLabelingCombined } from 'src/hooks/suite/useLabelingCombined';
import { useLabelingDeviceState } from 'src/hooks/suite/useLabelingDeviceState';

import { LabelingSwitchToLegacyModal } from '../../../components/suite/labeling/LabelingSwitchToLegacyModal';

export const Labeling = () => {
    const translate = useTranslation();

    const [legacyModalWarningVisible, setLegacyModalWarningVisible] = useState(false);
    const { device } = useDevice();
    const { isDeviceLabelingDisabled } = useLabelingDeviceState();

    const showLocalFirstStorage = useSelector(selectIsFeatureLocalFirstStorageAvailable);

    const {
        legacyMetadataState,
        legacyEnableIfNeeded,
        legacyDisableIfNeeded,
        localFirstDisableIfNeeded,
        localFirstEnableIfNeeded,
        isEvoluSupportedByDevice,
        isLocalFirstStorageEnabled,
    } = useLabelingCombined({
        deviceStaticSessionId: device?.state?.staticSessionId,
    });

    const translatedOptions: LabelingOption<string>[] = LABELING_SELECT_OPTIONS.map(option => ({
        ...option,
        label:
            !showLocalFirstStorage && option.value === 'legacy'
                ? translate.translationString(LABELING_LEGACY_OPTION_LABEL)
                : translate.translationString(option.label),
    }));

    const handleOnChange = (selected: LabelingOptionTranslated) => {
        const { value } = selected;

        // show a warning legacy modal when user selects legacy option while using local first storage
        if (value === 'legacy' && isLocalFirstStorageEnabled) {
            setLegacyModalWarningVisible(true);

            return;
        }

        switch (value) {
            case 'off':
                legacyDisableIfNeeded();
                localFirstDisableIfNeeded();
                break;

            case 'secure-sync':
                localFirstEnableIfNeeded();
                break;

            case 'legacy':
                localFirstDisableIfNeeded();
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

    const getSelectedOption = (): LabelingOptionTranslated => {
        const LABELING_SELECT_TRANSLATED_OPTIONS_MAP = LABELING_SELECT_OPTIONS.reduce(
            (acc, option) => {
                acc[option.value] = option;

                return acc;
            },
            {} as Record<LabelingSelectValue, LabelingOption<TranslationKey>>,
        );

        if (showLocalFirstStorage) {
            if (isLocalFirstStorageEnabled)
                return LABELING_SELECT_TRANSLATED_OPTIONS_MAP['secure-sync'];
            if (legacyMetadataState.enabled) return LABELING_SELECT_TRANSLATED_OPTIONS_MAP.legacy;

            return LABELING_SELECT_TRANSLATED_OPTIONS_MAP.off;
        }

        return legacyMetadataState.enabled
            ? {
                  ...LABELING_SELECT_TRANSLATED_OPTIONS_MAP.legacy,
                  label: LABELING_LEGACY_OPTION_LABEL,
              }
            : LABELING_SELECT_TRANSLATED_OPTIONS_MAP.off;
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
                        options={translatedOptions.filter(
                            option =>
                                option.value !== 'secure-sync' ||
                                (showLocalFirstStorage && isEvoluSupportedByDevice),
                        )}
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
