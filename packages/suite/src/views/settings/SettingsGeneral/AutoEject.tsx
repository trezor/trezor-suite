import { Switch } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';

import { setAutoEject } from 'src/actions/suite/suiteActions';
import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const AutoEject = () => {
    const isAutoEjectEnabled = useSelector(state => state.suite.settings.autoEject);
    const dispatch = useDispatch();

    const handleSwitchClick = () => {
        dispatch(setAutoEject(!isAutoEjectEnabled));

        analytics.report({
            type: EventType.SettingsGeneralAutoEject,
            payload: {
                value: !isAutoEjectEnabled,
            },
        });
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.AutoEject}>
            <TextColumn
                title={<Translation id="TR_AUTO_EJECT" />}
                description={<Translation id="TR_AUTO_EJECT_DESCRIPTION" />}
            />
            <ActionColumn>
                <Switch
                    isChecked={isAutoEjectEnabled}
                    onChange={handleSwitchClick}
                    data-testid="@settings/auto-eject-switch"
                />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
