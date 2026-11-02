import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { CardList } from '@trezor/components';

import { AssetsModal } from 'src/components/suite/asset-picker/components';

import { AssetDetailAccountIdentity } from './AssetDetailAccountIdentity';
import { ASSET_DETAIL_MODAL_MAX_HEIGHT } from './constants';

type AssetDetailSignVerifyModalProps = {
    symbol: NetworkSymbol;
    accounts: readonly Account[];
    onAccountClick: (account: Account) => void;
    onClose: () => void;
};

export const AssetDetailSignVerifyModal = ({
    symbol,
    accounts,
    onAccountClick,
    onClose,
}: AssetDetailSignVerifyModalProps) => {
    const { NetworkNameFormatter } = useFormatters();

    return (
        <AssetsModal
            heading={<Translation id="TR_NAV_SIGN_AND_VERIFY" />}
            description={<NetworkNameFormatter value={symbol} />}
            onClose={onClose}
            maxHeight={ASSET_DETAIL_MODAL_MAX_HEIGHT}
            padding={16}
            data-testid="@asset-detail/sign-verify"
        >
            <CardList>
                {accounts.map(account => (
                    <CardList.Item key={account.key} onClick={() => onAccountClick(account)}>
                        <AssetDetailAccountIdentity
                            account={account}
                            data-testid={`@asset-detail/sign-verify/${account.accountType}/${account.index}`}
                        />
                    </CardList.Item>
                ))}
            </CardList>
        </AssetsModal>
    );
};
