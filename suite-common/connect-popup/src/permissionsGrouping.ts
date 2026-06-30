import { type PermissionRequest } from '@trezor/connect';
import { unique } from '@trezor/utils/src/unique';

// There are permissions that depend on a coin, e.g. `read_address` for Bitcoin.
// There are also permissions that are not scoped to a coin, e.g. `management`.
export type GroupedPermissions = {
    coin?: string;
    permissions: PermissionRequest['permission'][];
};

export const permissionsAreCovered = (
    requested: PermissionRequest[],
    granted: PermissionRequest[],
): boolean =>
    requested.every(req =>
        granted.some(g => g.permission === req.permission && g.coin === req.coin),
    );

export const groupPermissionsByCoin = (permissions: PermissionRequest[]): GroupedPermissions[] => {
    const order: (string | undefined)[] = [];
    const byCoin = new Map<string | undefined, PermissionRequest['permission'][]>();

    for (const { coin, permission } of permissions) {
        if (!byCoin.has(coin)) {
            byCoin.set(coin, []);
            order.push(coin);
        }
        byCoin.get(coin)!.push(permission);
    }

    const coinFirst = order.filter(c => c !== undefined);
    const groups: GroupedPermissions[] = coinFirst.map(coin => ({
        coin,
        permissions: unique(byCoin.get(coin)!),
    }));
    if (byCoin.has(undefined)) {
        groups.push({ permissions: unique(byCoin.get(undefined)!) });
    }

    return groups;
};
