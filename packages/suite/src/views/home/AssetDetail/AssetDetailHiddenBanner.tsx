import { Translation } from '@suite/intl';
import {
    selectWalletAssetContractAddress,
    selectWalletAssetDisplaySymbol,
    selectWalletAssetHiddenReason,
    selectWalletAssetSymbol,
} from '@suite-common/assets';
import {
    DefinitionType,
    TokenManagementAction,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Banner } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { EyeIcon, EyeSlashIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from 'src/hooks/suite';

type AssetDetailHiddenBannerProps = {
    assetKey: WalletAssetKey;
};

export const AssetDetailHiddenBanner = ({ assetKey }: AssetDetailHiddenBannerProps) => {
    const { dispatch } = useServices(injectDispatch);
    const hiddenReason = useSelector(state => selectWalletAssetHiddenReason(state, assetKey));
    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const displaySymbol = useSelector(state => selectWalletAssetDisplaySymbol(state, assetKey));

    if (symbol === undefined || contractAddress === undefined || hiddenReason === undefined) {
        return null;
    }

    if (hiddenReason === 'unrecognized') {
        return (
            <Banner
                intent="warning"
                icon
                title={<Translation id="TR_ASSET_DETAIL_SUSPICIOUS_TOKEN_TITLE" />}
                description={<Translation id="TR_ASSET_DETAIL_SUSPICIOUS_TOKEN_DESCRIPTION" />}
                data-testid="@asset-detail/suspicious-token-banner"
            />
        );
    }

    const showToken = () =>
        dispatch(
            tokenDefinitionsActions.setTokenStatus({
                symbol,
                contractAddress,
                status: TokenManagementAction.SHOW,
                type: DefinitionType.COIN,
            }),
        );

    return (
        <Banner
            intent="info"
            icon={EyeSlashIcon}
            title={<Translation id="TR_ASSET_DETAIL_HIDDEN_TOKEN_TITLE" />}
            description={
                <Translation
                    id="TR_ASSET_DETAIL_HIDDEN_TOKEN_DESCRIPTION"
                    values={{ asset: displaySymbol }}
                />
            }
            rightContent={
                <Banner.Button
                    iconLeft={EyeIcon}
                    onClick={showToken}
                    data-testid="@asset-detail/hidden-token-banner/show"
                >
                    <Translation id="TR_UNHIDE_TOKEN" />
                </Banner.Button>
            }
            data-testid="@asset-detail/hidden-token-banner"
        />
    );
};
