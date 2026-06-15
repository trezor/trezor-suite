import { type Account, type ReceiveInfo } from '@suite-common/wallet-types';
import { comparePath } from '@trezor/crypto-utils';

type AccountAddress = NonNullable<Account['addresses']>['used'][number];

type GetUsedAddressesListParams = {
    account: Account;
    revealedAddresses: ReceiveInfo[];
    pendingAddresses: string[];
    addressLabels: Record<string, string | null>;
    currentFreshAddress?: {
        path: string;
    };
};

export const getUsedAddressesList = ({
    account,
    revealedAddresses,
    pendingAddresses,
    addressLabels,
    currentFreshAddress,
}: GetUsedAddressesListParams): AccountAddress[] => {
    const used = account.addresses?.used ?? [];
    const unused = account.addresses?.unused ?? [];

    const isUnusedAddressExplicitlyUsed = (addr: AccountAddress) =>
        revealedAddresses.some(revealedAddress => revealedAddress.path === addr.path) ||
        pendingAddresses.includes(addr.address) ||
        !!addressLabels[addr.address];

    const usedLikeAddresses = used.concat(
        unused.filter(
            addr => isUnusedAddressExplicitlyUsed(addr) && currentFreshAddress?.path !== addr.path,
        ),
    );

    const revealed = unused.reduce<AccountAddress[]>((result, addr) => {
        const isExplicitlyUsed = isUnusedAddressExplicitlyUsed(addr);
        const isLowerThanUsedAddress = usedLikeAddresses.some(
            usedAddress => comparePath(addr.path, usedAddress.path) < 0,
        );
        const isCurrentFreshAddress = currentFreshAddress?.path === addr.path;

        const isUsed = (isExplicitlyUsed || isLowerThanUsedAddress) && !isCurrentFreshAddress;

        return isUsed ? result.concat(addr) : result;
    }, []);

    return used
        .concat(revealed)
        .sort(
            (firstAddress, secondAddress) =>
                comparePath(firstAddress.path, secondAddress.path) * -1,
        );
};
