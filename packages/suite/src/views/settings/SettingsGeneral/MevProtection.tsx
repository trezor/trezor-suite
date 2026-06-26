import { FormattedList } from 'react-intl';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { networksCollection } from '@suite-common/wallet-config';
import { selectIsMevProtectionEnabled, setMevProtection } from '@suite-common/wallet-core';
import { Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useDispatch, useSelector } from 'src/hooks/suite';

export const MevProtection = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const dispatch = useDispatch();
    const isMevProtectionEnabled = useSelector(selectIsMevProtectionEnabled);

    const supportedNetworks = networksCollection
        .filter(network => network.features.includes('mev-protection'))
        .map(network => network.name);

    const handleSwitchChange = () => {
        const nextIsMevProtectionEnabled = !isMevProtectionEnabled;

        dispatch(setMevProtection(nextIsMevProtectionEnabled));

        analytics.report({
            type: events.settingsGeneralMevProtectionEvent.name,
            payload: { value: nextIsMevProtectionEnabled },
        });
    };

    return (
        <Anchor anchorId={SettingsAnchor.MevProtection}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                >
                    <TextColumn
                        title={<Translation id="TR_MEV" />}
                        description={
                            <>
                                <Translation id="TR_MEV_DESCRIPTION" />
                                <br />
                                <Translation
                                    id="TR_MEV_AVAILABLE_ON"
                                    values={{
                                        supportedNetworks: (
                                            <FormattedList
                                                type="conjunction"
                                                value={supportedNetworks}
                                            />
                                        ),
                                    }}
                                />
                            </>
                        }
                    />
                    <ActionColumn>
                        <Switch
                            isChecked={isMevProtectionEnabled}
                            onChange={handleSwitchChange}
                            data-testid="@settings/mev-protection-switch"
                        />
                    </ActionColumn>
                </SectionItem>
            )}
        </Anchor>
    );
};
