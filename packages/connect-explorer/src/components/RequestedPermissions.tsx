import styled from 'styled-components';

import { Button, IconButton, Select, Text } from '@trezor/components';
import {
    type CoinSymbol,
    GRANTABLE_PERMISSIONS,
    type MethodPermission,
    type PermissionRequest,
    coinSymbols,
} from '@trezor/connect-common';
import { PlusIcon, XIcon } from '@trezor/icons';

import * as trezorConnectActions from '../actions/trezorConnectActions';
import { useActions, useSelector } from '../hooks';
import type { Field } from '../types';

type CoinOption = CoinSymbol | '';

const permissionOptions = GRANTABLE_PERMISSIONS.map(permission => ({
    value: permission,
    label: permission,
}));

const NO_COIN: CoinOption = '';
const coinOptions: { value: CoinOption; label: string }[] = [
    { value: NO_COIN, label: '— coin-less —' },
    ...coinSymbols.map(coin => ({ value: coin, label: coin })),
];

// The reducer keys the change by `field.name` only; `value` carries the whole updated array.
const asField = (value: PermissionRequest[]): Field<PermissionRequest[]> => ({
    name: 'requestedPermissions',
    type: 'json',
    value,
});

const Wrapper = styled.div`
    margin: 16px 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const PermissionRow = styled.div`
    display: flex;
    gap: 8px;
    align-items: flex-end;
`;

const SelectWrapper = styled.div`
    flex: 1;
    min-width: 0;
`;

export const RequestedPermissions = () => {
    const permissions = useSelector(state => state.connect?.options?.requestedPermissions) ?? [];
    const coreMode = useSelector(state => state.connect?.options?.coreMode) ?? 'auto';
    const isDeeplink = coreMode === 'deeplink';
    const actions = useActions({
        onFieldChange: trezorConnectActions.onConnectOptionChange,
    });

    const update = (next: PermissionRequest[]) => actions.onFieldChange(asField(next), next);

    const updateAt = (index: number, patch: (p: PermissionRequest) => PermissionRequest) =>
        update(permissions.map((p, i) => (i === index ? patch(p) : p)));

    const addPermission = () => update([...permissions, { permission: 'read_address' }]);

    const removePermission = (index: number) => update(permissions.filter((_, i) => i !== index));

    const setPermission = (index: number, permission: MethodPermission) =>
        updateAt(index, p => ({ ...p, permission }));

    const setCoin = (index: number, coin: CoinOption) =>
        updateAt(index, p => ({ permission: p.permission, ...(coin ? { coin } : {}) }));

    return (
        <Wrapper>
            <Text typographyStyle="body-md-strong">Requested permissions (upfront)</Text>
            <Text typographyStyle="body-sm" priority="secondary">
                Permissions the dapp declares up front. They are sanitized by the popup and merged
                with the call-specific permissions into a single consent screen.
            </Text>
            {isDeeplink && (
                <Text typographyStyle="body-sm" intent="warning">
                    Not forwarded in deeplink (mobile) mode — the mobile transport does not carry
                    upfront permissions. Use the Suite web core mode to test the consent flow.
                </Text>
            )}

            {permissions.map((permission, index) => (
                <PermissionRow key={index} data-testid={`@requested-permissions/row/${index}`}>
                    <SelectWrapper>
                        <Select
                            data-testid={`@requested-permissions/permission/${index}`}
                            label="Permission"
                            value={permissionOptions.find(o => o.value === permission.permission)}
                            options={permissionOptions}
                            onChange={({ value }) => setPermission(index, value)}
                            isSearchable
                        />
                    </SelectWrapper>
                    <SelectWrapper>
                        <Select
                            data-testid={`@requested-permissions/coin/${index}`}
                            label="Coin (optional)"
                            value={coinOptions.find(o => o.value === (permission.coin ?? NO_COIN))}
                            options={coinOptions}
                            onChange={({ value }) => setCoin(index, value)}
                            isSearchable
                        />
                    </SelectWrapper>
                    <IconButton
                        icon={XIcon}
                        intent="neutral"
                        priority="secondary"
                        onClick={() => removePermission(index)}
                        tooltip={{ isActive: false }}
                        data-testid={`@requested-permissions/remove/${index}`}
                    />
                </PermissionRow>
            ))}

            <Button
                priority="secondary"
                size="small"
                iconLeft={PlusIcon}
                onClick={addPermission}
                data-testid="@requested-permissions/add"
                margin={{ top: 4 }}
            >
                Add permission
            </Button>
        </Wrapper>
    );
};
