import { groupPermissionsByCoin } from '@suite-common/connect-popup';
import { networks } from '@suite-common/wallet-config';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { type MethodPermission, type PermissionRequest } from '@trezor/connect';

const permissionTranslationKeysMap = {
    read_address: 'moduleConnectPopup.permissions.read_address',
    read_xpub: 'moduleConnectPopup.permissions.read_xpub',
    read_account_info: 'moduleConnectPopup.permissions.read_account_info',
    read_settings: 'moduleConnectPopup.permissions.read_settings',
    read_features: 'moduleConnectPopup.permissions.read_features',
    sign: 'moduleConnectPopup.permissions.sign',
    sign_message: 'moduleConnectPopup.permissions.sign_message',
    verify_message: 'moduleConnectPopup.permissions.verify_message',
    management: 'moduleConnectPopup.permissions.management',
    push_tx: 'moduleConnectPopup.permissions.push_tx',
    internal: 'moduleConnectPopup.permissions.internal',
} as const satisfies Record<MethodPermission, TxKeyPath>;

const getCoinLabel = (shortcut: string): string => {
    const key = shortcut.toLowerCase() as keyof typeof networks;

    return networks[key]?.name ?? shortcut.toUpperCase();
};

export const GroupedPermissionsList = ({ permissions }: { permissions: PermissionRequest[] }) => (
    <VStack spacing="sp12" padding="sp8">
        {groupPermissionsByCoin(permissions).map(group => (
            <VStack key={group.coin ?? '__device__'} spacing="sp4">
                <Text variant="body-sm">
                    {group.coin ? (
                        <Translation
                            id="moduleConnectPopup.permissions.coinHeading"
                            values={{ coin: getCoinLabel(group.coin) }}
                        />
                    ) : (
                        <Translation id="moduleConnectPopup.permissions.deviceHeading" />
                    )}
                </Text>
                {group.permissions.map(permission => (
                    <HStack key={permission} alignItems="center" spacing="sp8">
                        <Icon name="checkCircle" color="contentBrand" />
                        <Text color="contentSecondary" variant="body-sm" style={{ flex: 1 }}>
                            <Translation id={permissionTranslationKeysMap[permission]} />
                        </Text>
                    </HStack>
                ))}
            </VStack>
        ))}
    </VStack>
);
