import { AssetIcon, AssetName } from '@suite/assets';
import { Translation, useTranslation } from '@suite/intl';
import { gotoThunk, selectSettingsBackRoute } from '@suite/router';
import { createAssetId } from '@suite-common/asset-types';
import {
    selectWalletAssetContractAddress,
    selectWalletAssetNetworkSymbol,
} from '@suite-common/assets';
import { useFormatters } from '@suite-common/formatters';
import { Column, IconButton, Row, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { CaretLeftIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from '#src/hooks/suite/useSelector';
import { selectRoutedAssetKey } from '#src/views/home/AssetDetail/selectRoutedAssetKey';

const AssetDetailBackButton = () => {
    const { dispatch } = useServices(injectDispatch);
    const previousRoute = useSelector(selectSettingsBackRoute);
    const { translationString } = useTranslation();

    const goBack = () =>
        dispatch(gotoThunk({ routeName: previousRoute.name, params: previousRoute.params }));

    return (
        <IconButton
            icon={CaretLeftIcon}
            intent="neutral"
            priority="secondary"
            size="large"
            onClick={goBack}
            data-testid="@asset-detail/back"
            aria-label={translationString('TR_BACK')}
            tooltip={{ content: <Translation id="TR_BACK" /> }}
        />
    );
};

export const AssetDetailName = () => {
    const assetKey = useSelector(selectRoutedAssetKey);
    const { NetworkNameFormatter } = useFormatters();
    const networkSymbol = useSelector(state => selectWalletAssetNetworkSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));

    const assetId =
        networkSymbol === undefined ? undefined : createAssetId({ networkSymbol, contractAddress });

    return (
        <Row alignItems="center" gap={16}>
            <AssetDetailBackButton />
            {networkSymbol !== undefined && assetId !== undefined && (
                <Row gap={12} minWidth={0}>
                    <AssetIcon assetId={assetId} size={32} showNetworkIcon />
                    <Column alignItems="flex-start" minWidth={0}>
                        <Text typographyStyle="body-md-strong" ellipsisLineCount={1}>
                            <AssetName assetId={assetId} />
                        </Text>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <NetworkNameFormatter value={networkSymbol} />
                        </Text>
                    </Column>
                </Row>
            )}
        </Row>
    );
};
