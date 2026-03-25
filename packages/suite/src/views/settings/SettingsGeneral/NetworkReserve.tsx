import { FormattedList } from 'react-intl';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { networksCollection } from '@suite-common/wallet-config';
import { selectIsNetworkReserveEnabled, setNetworkReserve } from '@suite-common/wallet-core';
import { Switch } from '@trezor/components';
import { ActionColumn, TextColumn } from '@trezor/product-components';
import { NETWORK_RESERVE_URL } from '@trezor/urls';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

export const NetworkReserve = () => {
    const analytics = useAnalytics();
    const dispatch = useDispatch();
    const isNetworkReserveEnabled = useSelector(selectIsNetworkReserveEnabled);

    const supportedNetworks = networksCollection
        .filter(network => !!network.nativeTokenReserve)
        .map(network => network.name);

    const handleSwitchChange = () => {
        const nextIsNetworkReserveEnabled = !isNetworkReserveEnabled;

        dispatch(setNetworkReserve(nextIsNetworkReserveEnabled));

        analytics.report({
            type: events.settingsGeneralNetworkReserveEvent.name,
            payload: { value: nextIsNetworkReserveEnabled },
        });
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.NetworkReserve}>
            <TextColumn
                title={<Translation id="TR_NETWORK_RESERVE" />}
                description={
                    <Translation
                        id="TR_NETWORK_RESERVE_DESCRIPTION"
                        values={{
                            supportedNetworks: (
                                <FormattedList type="conjunction" value={supportedNetworks} />
                            ),
                        }}
                    />
                }
                bottomContent={<LearnMoreButton url={NETWORK_RESERVE_URL} />}
            />
            <ActionColumn>
                <Switch isChecked={isNetworkReserveEnabled} onChange={handleSwitchChange} />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
