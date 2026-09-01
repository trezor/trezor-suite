import { useDispatch } from 'react-redux';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { LearnMoreButton } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { getNetworksWithNativeTokenReserve } from '@suite-common/wallet-config';
import { selectIsNetworkReserveEnabled, setNetworkReserve } from '@suite-common/wallet-core';
import { Column, Switch } from '@trezor/components';
import {
    ActionColumn,
    SectionItem,
    SettingsRequirementBanner,
    TextColumn,
} from '@trezor/product-components';
import { NETWORK_RESERVE_URL } from '@trezor/urls';

import { useSelector } from 'src/hooks/suite';

export const NetworkReserve = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const dispatch = useDispatch();
    const isNetworkReserveEnabled = useSelector(selectIsNetworkReserveEnabled);

    const supportedNetworks = getNetworksWithNativeTokenReserve();

    const handleSwitchChange = () => {
        const nextIsNetworkReserveEnabled = !isNetworkReserveEnabled;

        dispatch(setNetworkReserve(nextIsNetworkReserveEnabled));

        analytics.report({
            type: events.settingsGeneralNetworkReserveEvent.name,
            payload: { value: nextIsNetworkReserveEnabled },
        });
    };

    return (
        <Anchor anchorId={SettingsAnchor.NetworkReserve}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                >
                    <TextColumn
                        title={<Translation id="TR_NETWORK_RESERVE" />}
                        description={<Translation id="TR_NETWORK_RESERVE_DESCRIPTION" />}
                        bottomContent={
                            <Column gap={8} alignItems="flex-start">
                                <SettingsRequirementBanner>
                                    <Translation
                                        id="TR_MEV_AVAILABLE_ON"
                                        values={{ supportedNetworks }}
                                    />
                                </SettingsRequirementBanner>
                                <LearnMoreButton url={NETWORK_RESERVE_URL} />
                            </Column>
                        }
                    />
                    <ActionColumn>
                        <Switch isChecked={isNetworkReserveEnabled} onChange={handleSwitchChange} />
                    </ActionColumn>
                </SectionItem>
            )}
        </Anchor>
    );
};
