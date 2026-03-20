import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { selectTorOnionLinks, suiteSettingsActions } from '@suite/settings';
import { Switch } from '@trezor/components';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { ActionColumn, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

/* keep torOnionLinks value as it is but hide this section when tor is off.
   when tor is off this value has no effect anyway (handled by ExternalLink hook) */
export const TorOnionLinks = () => {
    const torOnionLinks = useSelector(selectTorOnionLinks);
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const handleChange = () => {
        dispatch(suiteSettingsActions.setOnionLinks(!torOnionLinks));
        analytics.report({
            type: events.settingsTorOnionLinksEvent.name,
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
