import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { selectTorOnionLinks, suiteSettingsActions } from '@suite/settings';
import { Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

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
        <Anchor anchorId={SettingsAnchor.TorOnionLinks}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                >
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
                </SectionItem>
            )}
        </Anchor>
    );
};
