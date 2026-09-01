import { useDispatch } from 'react-redux';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { getNetworksWithMevProtection } from '@suite-common/wallet-config';
import { selectIsMevProtectionEnabled, setMevProtection } from '@suite-common/wallet-core';
import { Column, Switch } from '@trezor/components';
import {
    ActionColumn,
    SectionItem,
    SettingsRequirementBanner,
    TextColumn,
} from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

export const MevProtection = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const dispatch = useDispatch();
    const isMevProtectionEnabled = useSelector(selectIsMevProtectionEnabled);

    const supportedNetworks = getNetworksWithMevProtection();

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
                        description={<Translation id="TR_MEV_DESCRIPTION" />}
                        bottomContent={
                            <Column gap={8} alignItems="flex-start">
                                <SettingsRequirementBanner>
                                    <Translation
                                        id="TR_MEV_AVAILABLE_ON"
                                        values={{ supportedNetworks }}
                                    />
                                </SettingsRequirementBanner>
                            </Column>
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
