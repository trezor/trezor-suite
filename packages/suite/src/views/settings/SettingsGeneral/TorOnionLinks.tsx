import { analytics, EventType } from '@trezor/suite-analytics';

import { setOnionLinks } from 'src/actions/suite/suiteActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { Switch } from '@trezor/components';
import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';

/* keep torOnionLinks value as it is but hide this section when tor is off.
   when tor is off this value has no effect anyway (handled by ExternalLink hook) */
export const TorOnionLinks = () => {
    const torOnionLinks = useSelector(state => state.suite.settings.torOnionLinks);
    const dispatch = useDispatch();

    const handleChange = () => {
        dispatch(setOnionLinks(!torOnionLinks));
        analytics.report({
            type: EventType.SettingsTorOnionLinks,
            payload: {
                value: !torOnionLinks,
            },
        });
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.TorOnionLinks}>
            <TextColumn
                title={<Translation id="TR_ONION_LINKS_TITLE" />}
                description={<Translation id="TR_ONION_LINKS_DESCRIPTION" />}
            />
            <ActionColumn>
                <Switch
                    data-testid="@settings/general/onion-links-switch"
                    isChecked={torOnionLinks}
                    onChange={handleChange}
                />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
