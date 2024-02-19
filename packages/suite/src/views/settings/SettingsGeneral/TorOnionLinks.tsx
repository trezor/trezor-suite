import { analytics, EventType } from '@trezor/suite-analytics';

import { setOnionLinks } from 'src/actions/suite/suiteActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn, Translation } from 'src/components/suite';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

/* keep torOnionLinks value as it is but hide this section when tor is off.
   when tor is off this value has no effect anyway (handled by ExternalLink hook) */
export const TorOnionLinks = () => {
    const torOnionLinks = useSelector(state => state.suite.settings.torOnionLinks);
    const dispatch = useDispatch();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.TorOnionLinks);

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
        <SectionItem
            data-test-id="@settings/tor-onion-links"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_ONION_LINKS_TITLE" />}
                description={<Translation id="TR_ONION_LINKS_DESCRIPTION" />}
            />
            <ActionColumn>
                <Switch
                    dataTest="@settings/general/onion-links-switch"
                    isChecked={torOnionLinks}
                    onChange={handleChange}
                />
            </ActionColumn>
        </SectionItem>
    );
};
