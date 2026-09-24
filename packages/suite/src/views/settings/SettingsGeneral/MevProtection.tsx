import { events, injectDesktopAnalytics } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { getNetworksWithMevProtection } from '@suite-common/wallet-config';
import { selectIsMevProtectionEnabled, setMevProtection } from '@suite-common/wallet-core';
import { Banner, Switch } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';
import { SectionItem } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

export const MevProtection = () => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
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
                    title={<Translation id="TR_MEV" />}
                    description={<Translation id="TR_MEV_DESCRIPTION" />}
                    bottomContent={
                        <Banner
                            intent="neutral"
                            icon={InfoIcon}
                            description={
                                <Translation
                                    id="TR_MEV_AVAILABLE_ON"
                                    values={{ supportedNetworks }}
                                />
                            }
                        />
                    }
                    actions={
                        <Switch
                            isChecked={isMevProtectionEnabled}
                            onChange={handleSwitchChange}
                            data-testid="@settings/mev-protection-switch"
                        />
                    }
                />
            )}
        </Anchor>
    );
};
