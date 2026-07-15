import { type ReactNode, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type OptionProps } from 'react-select';

import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { LearnMoreButton } from '@suite/external-links';
import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import {
    metadataLabelingActions,
    metadataThunks,
    selectMetadata,
    useLabelingDeviceState,
} from '@suite/metadata';
import { Anchor, SettingsAnchor } from '@suite/router';
import { SuiteSyncServers, suiteSyncErrorHandler } from '@suite/suite-sync';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type MessageSystemRootState } from '@suite-common/message-system';
import {
    type WithSuiteSyncAndDeviceState,
    selectIsSuiteSyncEnabled,
    selectIsSuiteSyncFeatureAvailable,
    selectSuiteSyncInteraction,
} from '@suite-common/suite-sync';
import {
    selectTurnOffSuiteSyncDep,
    selectTurnOnSuiteSyncDep,
} from '@suite-common/suite-sync-types';
import { Box, Column, LoadingContent, Tooltip } from '@trezor/components';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { Option as SelectOption } from '@trezor/components/src/components/form/Select/customComponents';
import {
    ActionColumn,
    ActionSelect,
    SectionItem,
    SettingsRequirementBanner,
    TextColumn,
} from '@trezor/product-components';
import { exhaustive } from '@trezor/type-utils';
import { HELP_CENTER_LABELING } from '@trezor/urls';
import { typedObjectValues } from '@trezor/utils';

import { LabelingSwitchToLegacyModal } from './LabelingSwitchToLegacyModal';

export type LabelingSelectValue = 'off' | 'suite-sync' | 'legacy';

type LabelingOption<T> = { label: T; value: LabelingSelectValue };
type LabelingOptionTranslated = LabelingOption<TranslationKey>;
type LabelingSettingsRootState = WithSuiteSyncAndDeviceState & MessageSystemRootState;

const LABELING_SELECT_OPTIONS_MAP: Record<LabelingSelectValue, LabelingOption<TranslationKey>> = {
    off: { label: 'TR_LABELING_OFF', value: 'off' },
    'suite-sync': { label: 'TR_LABELING_SECURE_SYNC', value: 'suite-sync' },
    legacy: { label: 'TR_LABELING_LEGACY', value: 'legacy' },
};

const LABELING_LEGACY_OPTION_LABEL = 'TR_LABELING_ON';

const LABELING_SELECT_OPTIONS = typedObjectValues(LABELING_SELECT_OPTIONS_MAP);

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

export const LabelingSettings = () => {
    const { translationString } = useTranslation();

    const { analytics, turnOffSuiteSync, turnOnSuiteSync } = useServices(
        selectDesktopAnalyticsDep,
        selectTurnOffSuiteSyncDep,
        selectTurnOnSuiteSyncDep,
    );

    const dispatch = useDispatch();
    const [legacyModalWarningVisible, setLegacyModalWarningVisible] = useState(false);
    const { device } = useDevice();
    const deviceStaticSessionId = device?.state?.staticSessionId;
    const { isDeviceLabelingDisabled } = useLabelingDeviceState();

    const showSuiteSync = useSelector((state: LabelingSettingsRootState) =>
        selectIsSuiteSyncFeatureAvailable(state),
    );
    const isSuiteSyncEnabled = useSelector((state: LabelingSettingsRootState) =>
        selectIsSuiteSyncEnabled(state),
    );
    const suiteSyncInteraction = useSelector((state: LabelingSettingsRootState) =>
        selectSuiteSyncInteraction(state, deviceStaticSessionId ?? null),
    );
    const isSuiteSyncUnsupported = suiteSyncInteraction === 'unsupported';

    const legacyMetadataState = useSelector(selectMetadata);

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
        await turnOffSuiteSync();
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

                await turnOffSuiteSync();
                break;

            case 'suite-sync': {
                const result = await turnOnSuiteSync({ deviceStaticSessionId });
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
                            bottomContent={
                                <Column gap={8} alignItems="flex-start">
                                    {showSuiteSync && isSuiteSyncUnsupported && (
                                        <SettingsRequirementBanner>
                                            <Translation id="TR_NOT_SUPPORTED_ON_THIS_DEVICE" />
                                        </SettingsRequirementBanner>
                                    )}
                                    <LearnMoreButton url={HELP_CENTER_LABELING} />
                                </Column>
                            }
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
            {isSuiteSyncEnabled && <SuiteSyncServers />}
        </>
    );
};
