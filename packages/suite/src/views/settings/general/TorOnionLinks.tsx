import React from 'react';

import * as suiteActions from '@suite-actions/suiteActions';
import { useAnalytics, useSelector, useActions } from '@suite-hooks';
import { ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { Switch } from '@trezor/components';
import { Translation } from '@suite-components';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

/* keep torOnionLinks value as it is but hide this section when tor is off.
   when tor is off this value has no effect anyway (handled by ExternalLink hook) */
export const TorOnionLinks = () => {
    const analytics = useAnalytics();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.TorOnionLinks);

    const { torOnionLinks } = useSelector(state => ({
        torOnionLinks: state.suite.settings.torOnionLinks,
    }));

    const { setOnionLinks } = useActions({
        setOnionLinks: suiteActions.setOnionLinks,
    });

    return (
        <SectionItem
            data-test="@settings/tor-onion-links"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_ONION_LINKS_TITLE" />}
                description={<Translation id="TR_ONION_LINKS_DESCRIPTION" />}
            />
            <ActionColumn>
                <Switch
                    data-test="@settings/general/onion-links-switch"
                    checked={torOnionLinks}
                    onChange={() => {
                        analytics.report({
                            type: 'menu/toggle-onion-links',
                            payload: {
                                value: !torOnionLinks,
                            },
                        });
                        setOnionLinks(!torOnionLinks);
                    }}
                />
            </ActionColumn>
        </SectionItem>
    );
};
