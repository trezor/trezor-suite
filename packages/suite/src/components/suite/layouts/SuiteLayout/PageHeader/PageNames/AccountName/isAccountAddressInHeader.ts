import { type Account } from '@suite-common/wallet-types';
import { isUtxoBased } from '@suite-common/wallet-utils';

type IsAccountAddressInHeaderParams = {
    account: Account;
    routeName: string | undefined;
    isAssetFirstHome: boolean;
};

export const isAccountAddressInHeader = ({
    account,
    routeName,
    isAssetFirstHome,
}: IsAccountAddressInHeaderParams): boolean =>
    isAssetFirstHome && routeName === 'wallet-index' && !isUtxoBased(account);
