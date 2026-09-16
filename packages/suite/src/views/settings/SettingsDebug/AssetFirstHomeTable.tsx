import { selectIsAssetFirstHomeTableEnabled, suiteSettingsActions } from '@suite/settings';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import { Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

export const AssetFirstHomeTable = () => {
    const isAssetFirstHomeTableEnabled = useSelector(selectIsAssetFirstHomeTableEnabled);
    const { dispatch } = useServices(selectDispatch);

    const toggle = () =>
        dispatch(
            suiteSettingsActions.setDebugMode({
                isAssetFirstHomeTableEnabled: !isAssetFirstHomeTableEnabled,
            }),
        );

    return (
        <SectionItem>
            <TextColumn
                title="Asset first table on home tab"
                description="Replace the home tab with one row per asset and network — Ether on Ethereum and Ether on Arbitrum as separate lines — instead of one row per network. No graph and no promotions."
            />
            <ActionColumn>
                <Switch
                    isChecked={isAssetFirstHomeTableEnabled}
                    onChange={toggle}
                    data-testid="@settings/debug/asset-first-home-table"
                />
            </ActionColumn>
        </SectionItem>
    );
};
