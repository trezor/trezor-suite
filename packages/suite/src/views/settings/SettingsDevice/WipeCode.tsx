import { useSelector } from 'react-redux';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { selectIsDeviceProtectedByWipeCode } from '@suite-common/device';
import { ActionButton, ActionColumn, TextColumn } from '@trezor/product-components';
import { HELP_CENTER_WIPE_CODE_URL } from '@trezor/urls';

import { changeWipeCode } from 'src/actions/settings/deviceSettingsActions';
import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { useDispatch } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

interface Props {
    isDeviceLocked: boolean;
}

export const WipeCode = ({ isDeviceLocked }: Props) => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const isDeviceProtectedByWipeCode = useSelector(selectIsDeviceProtectedByWipeCode);

    const enableWipeCode = () => {
        dispatch(changeWipeCode({ remove: false }));
        analytics.report({
            type: isDeviceProtectedByWipeCode
                ? events.settingsDeviceChangeWipeCodeEvent.name
                : events.settingsDeviceSetupWipeCodeEvent.name,
        });
    };

    const disableWipeCode = () => {
        dispatch(changeWipeCode({ remove: true }));
        analytics.report({
            type: events.settingsDeviceDisableWipeCodeEvent.name,
        });
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.WipeCode}>
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_WIPE_CODE_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_WIPE_CODE_DESC" />}
                bottomContent={<LearnMoreButton url={HELP_CENTER_WIPE_CODE_URL} />}
            />

            <ActionColumn>
                <ActionButton
                    onClick={enableWipeCode}
                    isDisabled={isDeviceLocked}
                    intent="critical"
                    isTooltipActive={isDeviceLocked}
                    tooltipContent={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                >
                    <Translation
                        id={
                            isDeviceProtectedByWipeCode
                                ? 'TR_CHANGE_WIPE_CODE'
                                : 'TR_SETUP_WIPE_CODE'
                        }
                    />
                </ActionButton>

                {isDeviceProtectedByWipeCode && (
                    <ActionButton
                        onClick={disableWipeCode}
                        isDisabled={isDeviceLocked}
                        intent="critical"
                        isTooltipActive={isDeviceLocked}
                        tooltipContent={
                            <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                        }
                    >
                        <Translation id="TR_REMOVE_WIPE_CODE" />
                    </ActionButton>
                )}
            </ActionColumn>
        </SettingsSectionItem>
    );
};
