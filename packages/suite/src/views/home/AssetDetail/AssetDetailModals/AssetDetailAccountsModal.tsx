import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { selectWalletAssetHoldings } from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { CardList } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { AssetsModal } from 'src/components/suite/asset-picker/components';
import { useSelector } from 'src/hooks/suite';

import { AssetDetailAccountListItem } from './AssetDetailAccountListItem';
import { AssetDetailAssetDescription } from './AssetDetailAssetDescription';
import { ASSET_DETAIL_MODAL_MAX_HEIGHT } from './constants';

type AssetDetailAccountsModalProps = {
    assetKey: WalletAssetKey;
    onClose: () => void;
};

export const AssetDetailAccountsModal = ({ assetKey, onClose }: AssetDetailAccountsModalProps) => {
    const { dispatch } = useServices(injectDispatch);
    const assetAccounts = useSelector(state => selectWalletAssetHoldings(state, assetKey));

    const openAccount = (account: Account) => {
        onClose();
        dispatch(
            gotoThunk({
                routeName: 'wallet-index',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );
    };

    return (
        <AssetsModal
            heading={<Translation id="TR_ASSET_DETAIL_ACCOUNTS" />}
            description={<AssetDetailAssetDescription assetKey={assetKey} />}
            onClose={onClose}
            maxHeight={ASSET_DETAIL_MODAL_MAX_HEIGHT}
            padding={16}
            data-testid="@asset-detail/accounts"
        >
            <CardList>
                {assetAccounts.map(assetAccount => (
                    <AssetDetailAccountListItem
                        key={assetAccount.assetAccountKey}
                        assetAccount={assetAccount}
                        onClick={openAccount}
                    />
                ))}
            </CardList>
        </AssetsModal>
    );
};
