import { type Account, type ReceiveInfo } from '@suite-common/wallet-types';
import { comparePath } from '@trezor/crypto-utils';

type AccountAddress = NonNullable<Account['addresses']>['used'][number];

type GetUsedAddressesListParams = {
    account: Account;
    touchedAddresses: ReceiveInfo[];
    pendingAddresses: string[];
    addressLabels: Record<string, string | null>;
    currentFreshAddress?: {
        path: string;
    };
};

export const getUsedAddressesList = ({
    account,
    touchedAddresses,
    pendingAddresses,
    addressLabels,
    currentFreshAddress,
}: GetUsedAddressesListParams): AccountAddress[] => {
    const used = account.addresses?.used ?? [];
    const unused = account.addresses?.unused ?? [];

    const isUnusedAddressExplicitlyUsed = (addr: AccountAddress) =>
        touchedAddresses.some(touchedAddress => touchedAddress.path === addr.path) ||
        pendingAddresses.includes(addr.address) ||
        !!addressLabels[addr.address];

    const usedLikeAddresses = used.concat(
        unused.filter(
            addr => isUnusedAddressExplicitlyUsed(addr) && currentFreshAddress?.path !== addr.path,
        ),
    );

    const touched = unused.reduce<AccountAddress[]>((result, addr) => {
        const isExplicitlyUsed = isUnusedAddressExplicitlyUsed(addr);
        const isLowerThanUsedAddress = usedLikeAddresses.some(
            usedAddress => comparePath(addr.path, usedAddress.path) < 0,
        );
        const isCurrentFreshAddress = currentFreshAddress?.path === addr.path;

        const isUsed = (isExplicitlyUsed || isLowerThanUsedAddress) && !isCurrentFreshAddress;

        return isUsed ? result.concat(addr) : result;
    }, []);

    return used
        .concat(touched)
        .sort(
            (firstAddress, secondAddress) =>
                comparePath(firstAddress.path, secondAddress.path) * -1,
        );
};
