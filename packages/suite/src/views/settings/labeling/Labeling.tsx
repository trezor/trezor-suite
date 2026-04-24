import { type ReactNode, useState } from 'react';
import { type OptionProps } from 'react-select';

import { useDevice } from '@suite/device';
import { Translation, useTranslation } from '@suite/intl';
import { metadataLabelingActions, metadataThunks } from '@suite/metadata';
import { Anchor, SettingsAnchor } from '@suite/router';
import { isSuiteSyncRuntimeAvailable, SuiteSyncServers } from '@suite/suite-sync';
import { events } from '@suite-common/analytics';
import {
    selectIsSuiteSyncEnabled,
    selectIsSuiteSyncFeatureAvailable,
} from '@suite-common/suite-sync';
import { Box, LoadingContent, Tooltip } from '@trezor/components';
import { Option as SelectOption } from '@trezor/components/src/components/form/Select/customComponents';
import { ActionColumn, ActionSelect, SectionItem, TextColumn } from '@trezor/product-components';
import { exhaustive } from '@trezor/type-utils';
import { HELP_CENTER_LABELING } from '@trezor/urls';

import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { LabelingSwitchToLegacyModal } from 'src/components/suite/labeling/LabelingSwitchToLegacyModal';
import { suiteSyncErrorHandler } from 'src/components/suite/labeling/suiteSyncErrorHandler';
import {
    LABELING_LEGACY_OPTION_LABEL,
    LABELING_SELECT_OPTIONS,
    type LabelingOption,
    type LabelingOptionTranslated,
    type LabelingSelectValue,
} from 'src/constants/suite/labeling';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useLabelingDeviceState } from 'src/hooks/suite/useLabelingDeviceState';
import { useSuiteServices } from 'src/support/SuiteServicesProvider';
import { useAnalytics } from 'src/support/useAnalytics';

type LabelingTranslatedOption = LabelingOption<string> & {
    tooltipContent?: ReactNode;
};

const LABELING_SELECT_TEST_ID = '@settings/labeling-select';

const LabelingOption = ({
    children,
    data,
    isDisabled,
    ...rest
}: OptionProps<LabelingTranslatedOption, false>) => (
    <SelectOption
        {...rest}
        data={data}
        isDisabled={isDisabled}
        size="small"
        data-testid={LABELING_SELECT_TEST_ID}
    >
        <Tooltip
            content={data.tooltipContent}
            isActive={isDisabled && !!data.tooltipContent}
            cursor={isDisabled ? 'default' : 'pointer'}
        >
            <Box width="100%">{children}</Box>
        </Tooltip>
    </SelectOption>
);

export const Labeling = () => {
    const { translationString } = useTranslation();
    const { suiteSync } = useSuiteServices();
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const [legacyModalWarningVisible, setLegacyModalWarningVisible] = useState(false);
    const { device } = useDevice();
    const deviceStaticSessionId = device?.state?.staticSessionId;
    const { isDeviceLabelingDisabled } = useLabelingDeviceState();

    const isRuntimeAvailable = isSuiteSyncRuntimeAvailable();
    const showSuiteSync = useSelector(selectIsSuiteSyncFeatureAvailable) && isRuntimeAvailable;
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled) && isRuntimeAvailable;

    const legacyMetadataState = useSelector(state => state.metadata);

    const translatedOptions: LabelingTranslatedOption[] = LABELING_SELECT_OPTIONS.map(option => ({
        ...option,
        label:
            !showSuiteSync && option.value === 'legacy'
                ? translationString(LABELING_LEGACY_OPTION_LABEL)
                : translationString(option.label),
        tooltipContent:
            option.value === 'legacy' && isDeviceLabelingDisabled
                ? translationString('TR_LABELING_LEGACY_DISABLED_TOOLTIP')
                : undefined,
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

            <Anchor anchorId={SettingsAnchor.Labeling}>
                {({ anchorId, anchorRef, shouldHighlight }) => (
                    <SectionItem
                        data-testid={anchorId}
                        ref={anchorRef}
                        shouldHighlight={shouldHighlight}
                    >
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
                                components={{ Option: LabelingOption }}
                                data-testid={LABELING_SELECT_TEST_ID}
                                isDisabled={isDeviceLabelingDisabled && !showSuiteSync}
                                isOptionDisabled={option => isOptionDisabled(option.value)}
                            />
                        </ActionColumn>
                    </SectionItem>
                )}
            </Anchor>
            {isSuiteSyncEnabled && <SuiteSyncServers suiteSync={suiteSync} />}
        </>
    );
};
