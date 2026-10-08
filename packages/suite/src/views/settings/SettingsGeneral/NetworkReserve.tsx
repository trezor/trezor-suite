import { events, injectDesktopAnalytics } from '@suite/analytics';
import { LearnMoreButton } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { getNetworksWithNativeTokenReserve } from '@suite-common/wallet-config';
import { selectIsNetworkReserveEnabled, setNetworkReserve } from '@suite-common/wallet-core';
import { Banner, Column, Switch } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';
import { SectionItem } from '@trezor/product-components';
import { NETWORK_RESERVE_URL } from '@trezor/urls';

import { useSelector } from 'src/hooks/suite';

export const NetworkReserve = () => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
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
                    title={<Translation id="TR_NETWORK_RESERVE" />}
                    description={<Translation id="TR_NETWORK_RESERVE_DESCRIPTION" />}
                    bottomContent={
                        <Column gap={8} alignItems="flex-start">
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

                            <LearnMoreButton url={NETWORK_RESERVE_URL} />
                        </Column>
                    }
                    actions={
                        <Switch isChecked={isNetworkReserveEnabled} onChange={handleSwitchChange} />
                    }
                />
            )}
        </Anchor>
    );
};
