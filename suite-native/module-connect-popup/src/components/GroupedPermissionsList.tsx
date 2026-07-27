import { useState } from 'react';
import { Pressable } from 'react-native';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import {
    PERMISSION_PREVIEW_LIMIT,
    getCoinLabel,
    groupPermissionsByCoin,
    permissionIcons,
} from '@suite-common/connect-popup';
import { isNetworkIconSymbol } from '@suite-common/icons';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { AccordionContent, AnimatedBox, Box, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon, NetworkIcon } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { type MethodPermission, type PermissionRequest } from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const CHEVRON_ANIMATION_DURATION = 200;

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

const fallbackBadgeStyle = prepareNativeStyle(utils => ({
    width: 24,
    height: 24,
    borderRadius: utils.borders.radii.r6,
    backgroundColor: utils.colors.elementFillContrast,
    alignItems: 'center',
    justifyContent: 'center',
}));

// Network icon for a coin group; falls back to a rounded-square badge that
// mirrors NetworkIcon for the device group (no coin) or altcoins that suite has
// no network icon for.
const GroupBadge = ({ coin }: { coin?: string }) => {
    const { applyStyle } = useNativeStyles();
    const symbol = coin?.toLowerCase();

    if (symbol && isNetworkIconSymbol(symbol)) {
        return <NetworkIcon symbol={symbol as NetworkSymbol} size={24} />;
    }

    return (
        <Box style={applyStyle(fallbackBadgeStyle)}>
            <Icon name={coin ? 'coins' : 'circuitry'} size="medium" color="contentPrimaryInverse" />
        </Box>
    );
};

// Shared so the collapsed preview and the expanded rows render identical icons.
const PermissionIcon = ({ permission }: { permission: MethodPermission }) => (
    <Icon name={permissionIcons[permission]} size="mediumLarge" color="contentSecondary" />
);

const PermissionPreview = ({ permissions }: { permissions: MethodPermission[] }) => {
    const shown = permissions.slice(0, PERMISSION_PREVIEW_LIMIT);
    const remaining = permissions.length - shown.length;

    return (
        <HStack spacing="sp4" alignItems="center">
            {shown.map(permission => (
                <PermissionIcon key={permission} permission={permission} />
            ))}
            {remaining > 0 && (
                <Text variant="body-sm" color="contentSecondary">
                    +{remaining}
                </Text>
            )}
        </HStack>
    );
};

type PermissionGroupProps = {
    coin?: string;
    permissions: MethodPermission[];
    defaultIsOpen: boolean;
};

const PermissionGroup = ({ coin, permissions, defaultIsOpen }: PermissionGroupProps) => {
    const [isOpen, setIsOpen] = useState(defaultIsOpen);
    const isOpenedShared = useSharedValue(defaultIsOpen);

    const chevronStyle = useAnimatedStyle(() => ({
        transform: [
            {
                rotate: withTiming(`${isOpenedShared.value ? -180 : 0}deg`, {
                    duration: CHEVRON_ANIMATION_DURATION,
                }),
            },
        ],
    }));

    const handleToggle = () => {
        const nextIsOpen = !isOpen;
        setIsOpen(nextIsOpen);

        isOpenedShared.value = nextIsOpen;
    };

    return (
        <VStack spacing="sp4">
            <Pressable
                onPress={handleToggle}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
            >
                <HStack justifyContent="space-between" alignItems="center">
                    <HStack spacing="sp8" alignItems="center" flex={1}>
                        <GroupBadge coin={coin} />
                        <Text variant="body-md-strong">
                            {coin ? (
                                <Translation
                                    id="moduleConnectPopup.permissions.coinHeading"
                                    values={{ coin: getCoinLabel(coin) }}
                                />
                            ) : (
                                <Translation id="moduleConnectPopup.permissions.deviceHeading" />
                            )}
                        </Text>
                        {!isOpen && <PermissionPreview permissions={permissions} />}
                    </HStack>
                    <AnimatedBox style={chevronStyle}>
                        <Icon name="caretDown" size="mediumLarge" color="contentSecondary" />
                    </AnimatedBox>
                </HStack>
            </Pressable>
            <AccordionContent isOpened={isOpenedShared}>
                <VStack spacing="sp8" paddingTop="sp8">
                    {permissions.map(permission => (
                        <HStack key={permission} spacing="sp8" alignItems="center">
                            <PermissionIcon permission={permission} />
                            <Text variant="body-sm" color="contentSecondary" style={{ flex: 1 }}>
                                <Translation id={permissionTranslationKeysMap[permission]} />
                            </Text>
                        </HStack>
                    ))}
                </VStack>
            </AccordionContent>
        </VStack>
    );
};

type GroupedPermissionsListProps = {
    permissions: PermissionRequest[];
    // Groups are expanded by default: granting is a security decision, so nothing
    // is hidden behind a tap. They remain collapsible to tidy up long lists.
    defaultIsOpen?: boolean;
};

export const GroupedPermissionsList = ({
    permissions,
    defaultIsOpen = true,
}: GroupedPermissionsListProps) => (
    <VStack spacing="sp12" padding="sp8">
        {groupPermissionsByCoin(permissions).map(group => (
            <PermissionGroup
                key={group.coin ?? '__device__'}
                coin={group.coin}
                permissions={group.permissions}
                defaultIsOpen={defaultIsOpen}
            />
        ))}
    </VStack>
);
