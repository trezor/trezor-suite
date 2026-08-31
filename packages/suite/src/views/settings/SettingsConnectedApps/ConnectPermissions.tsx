import { useState } from 'react';
import { useDispatch } from 'react-redux';

import styled from 'styled-components';

import { selectIsDebugModeActive } from '@suite/debug';
import { Translation, useTranslation } from '@suite/intl';
import {
    PERMISSION_PREVIEW_LIMIT,
    connectPopupActions,
    getCoinLabel,
    groupPermissionsByCoin,
    permissionIcons,
    selectConnectAppPermissions,
} from '@suite-common/connect-popup';
import {
    Box,
    Card,
    Center,
    Collapsible,
    Column,
    Dropdown,
    H3,
    Icon,
    IconButton,
    type IconComponent,
    Row,
    Text,
    Tooltip,
} from '@trezor/components';
import { type CoinSymbol, type MethodPermission, type PermissionRequest } from '@trezor/connect';
import {
    BellSlashIcon,
    BroadcastIcon,
    CaretDownIcon,
    CheckIcon,
    CircuitryIcon,
    CoinsIcon,
    CpuIcon,
    CubeIcon,
    EyeIcon,
    GearSixIcon,
    KeyIcon,
    NotePencilIcon,
    SealCheckIcon,
    SignatureIcon,
    WalletIcon,
    XCircleIcon,
} from '@trezor/icons';
import { NetworkIcon, isNetworkSymbolWithIcon } from '@trezor/product-components';

import { ConnectAppIcon } from 'src/components/suite/ConnectAppIcon';
import { ConnectProcessLabel } from 'src/components/suite/ConnectProcessLabel';
import { useSelector } from 'src/hooks/suite';

// The remove button sits next to the permission text and is only revealed when
// the row is hovered or a child receives keyboard focus, to reduce clutter.
// Mirrors the reveal styling of EditableText's ActionsContainer.
const PermissionRemove = styled.div`
    display: flex;
    opacity: 0;
    pointer-events: none;
    transform: translateX(-5px);
`;

const PermissionRow = styled.div`
    &:hover ${PermissionRemove}, &:focus-within ${PermissionRemove} {
        opacity: 1;
        pointer-events: auto;
        transform: translateX(0);
        transition: 200ms ease-in-out;
    }
`;

// TODO: Once native use same icon approach use permissionIcons instead
const permissionIconsLocalMap: Record<keyof typeof permissionIcons, IconComponent> = {
    read_address: EyeIcon,
    read_xpub: KeyIcon,
    read_account_info: WalletIcon,
    read_features: CpuIcon,
    sign: SignatureIcon,
    sign_message: NotePencilIcon,
    verify_message: SealCheckIcon,
    management: GearSixIcon,
    push_tx: BroadcastIcon,
    internal: CubeIcon,
};

const getPermissionIcon = (permission: string): IconComponent =>
    Object.hasOwn(permissionIcons, permission)
        ? permissionIconsLocalMap[permission as keyof typeof permissionIconsLocalMap]
        : CubeIcon;

export const getPermissionText = (permissionType: MethodPermission | string) => {
    switch (permissionType) {
        case 'read_address':
            return <Translation id="TR_PERMISSION_READ_ADDRESS" />;
        case 'read_xpub':
            return <Translation id="TR_PERMISSION_READ_XPUB" />;
        case 'read_account_info':
            return <Translation id="TR_PERMISSION_READ_ACCOUNT_INFO" />;
        case 'read_features':
            return <Translation id="TR_PERMISSION_READ_FEATURES" />;
        case 'sign':
            return <Translation id="TR_PERMISSION_SIGN" />;
        case 'sign_message':
            return <Translation id="TR_PERMISSION_SIGN_MESSAGE" />;
        case 'verify_message':
            return <Translation id="TR_PERMISSION_VERIFY_MESSAGE" />;
        case 'management':
            return <Translation id="TR_PERMISSION_MANAGEMENT" />;
        case 'push_tx':
            return <Translation id="TR_PERMISSION_PUSH_TX" />;
        case 'custom-message':
            return <Translation id="TR_PERMISSION_CUSTOM_MESSAGE" />;
        default:
            return '';
    }
};

// Network icon for a coin group; falls back to a rounded-square badge that
// mirrors NetworkIcon for the device group (no coin) or altcoins that suite has
// no network icon for.
const GroupBadge = ({ coin }: { coin?: string }) => {
    const symbol = coin?.toLowerCase();

    if (symbol && isNetworkSymbolWithIcon(symbol)) {
        return <NetworkIcon networkSymbol={symbol} size={24} />;
    }

    return (
        <Box width={24} height={24} borderRadius={6} backgroundColor="elementFillContrast">
            <Center>
                <Icon
                    as={coin ? CoinsIcon : CircuitryIcon}
                    size={16}
                    color="contentPrimaryInverse"
                />
            </Center>
        </Box>
    );
};

// Shared so the collapsed preview and the expanded rows render identical icons.
const PermissionIcon = ({ permission }: { permission: MethodPermission }) => (
    <Icon as={getPermissionIcon(permission)} size={20} intent="neutral" priority="secondary" />
);

const PermissionPreview = ({ permissions }: { permissions: MethodPermission[] }) => {
    const shown = permissions.slice(0, PERMISSION_PREVIEW_LIMIT);
    const remaining = permissions.length - shown.length;

    return (
        <Row gap={4}>
            {shown.map(permission => (
                <PermissionIcon key={permission} permission={permission} />
            ))}
            {remaining > 0 && (
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    +{remaining}
                </Text>
            )}
        </Row>
    );
};

// The e2e testID convention allows no underscores; connectPermissionsModal.ts mirrors this.
const permissionTestId = (permission: MethodPermission) => permission.replace(/_/g, '-');

type PermissionGroupProps = {
    coin?: CoinSymbol;
    permissions: MethodPermission[];
    defaultIsOpen: boolean;
    onRemovePermission?: (permission: PermissionRequest) => void;
};

const PermissionGroup = ({
    coin,
    permissions,
    defaultIsOpen,
    onRemovePermission,
}: PermissionGroupProps) => {
    const { translationString } = useTranslation();
    const [isOpen, setIsOpen] = useState(defaultIsOpen);

    return (
        <Collapsible isOpen={isOpen} data-testid={`@connect-permissions/group/${coin ?? 'device'}`}>
            <Collapsible.Toggle onClick={() => setIsOpen(!isOpen)}>
                <Row justifyContent="space-between" gap={12} padding={{ vertical: 8 }}>
                    <Row gap={16}>
                        <Row gap={12}>
                            <GroupBadge coin={coin} />
                            <Text typographyStyle="body-md-strong">
                                {coin ? getCoinLabel(coin) : <Translation id="TR_DEVICE" />}
                            </Text>
                        </Row>
                        {!isOpen && <PermissionPreview permissions={permissions} />}
                    </Row>
                    <Collapsible.ToggleIcon icon={CaretDownIcon} size={20} />
                </Row>
            </Collapsible.Toggle>
            <Collapsible.Content>
                <Column gap={8} margin={{ top: 4, bottom: 8 }}>
                    {permissions.map(permission => (
                        <PermissionRow
                            key={permission}
                            data-testid={`@connect-permissions/permission/${permissionTestId(permission)}`}
                        >
                            <Row gap={12}>
                                <PermissionIcon permission={permission} />
                                <Text typographyStyle="body-sm">
                                    {getPermissionText(permission)}
                                </Text>
                                {onRemovePermission && (
                                    <PermissionRemove>
                                        <IconButton
                                            icon={XCircleIcon}
                                            size="small"
                                            intent="neutral"
                                            priority="secondary"
                                            tooltip={{}}
                                            aria-label={translationString('TR_FORGET_PERMISSION')}
                                            onClick={() => onRemovePermission({ permission, coin })}
                                        />
                                    </PermissionRemove>
                                )}
                            </Row>
                        </PermissionRow>
                    ))}
                </Column>
            </Collapsible.Content>
        </Collapsible>
    );
};

type GroupedPermissionsListProps = {
    permissions: PermissionRequest[];
    // Groups are expanded by default in the grant-permissions modal (a security
    // decision — nothing hidden behind a click) and collapsed in the settings
    // overview, where the preview communicates scope at a glance.
    defaultIsOpen?: boolean;
    onRemovePermission?: (permission: PermissionRequest) => void;
};

export const GroupedPermissionsList = ({
    permissions,
    defaultIsOpen = false,
    onRemovePermission,
}: GroupedPermissionsListProps) => (
    <Column hasDivider gap={8} alignItems="stretch" padding={{ horizontal: 4 }}>
        {groupPermissionsByCoin(permissions).map(group => (
            <PermissionGroup
                key={group.coin ?? '__device__'}
                coin={group.coin}
                permissions={group.permissions}
                defaultIsOpen={defaultIsOpen}
                onRemovePermission={onRemovePermission}
            />
        ))}
    </Column>
);

export const ConnectPermissions = () => {
    const dispatch = useDispatch();
    const apps = useSelector(selectConnectAppPermissions);
    const isDebugModeActive = useSelector(selectIsDebugModeActive);

    if (apps.length === 0) {
        return (
            <Column flex="1" justifyContent="center" gap={8}>
                <H3 align="center">
                    <Translation id="TR_NO_CONNECTED_APPS" />
                </H3>
                <Text
                    align="center"
                    intent="neutral"
                    priority="secondary"
                    data-testid="@settings/connect-apps/no-apps"
                >
                    <Translation id="TR_NO_CONNECTED_APPS_DESCRIPTION" />
                </Text>
            </Column>
        );
    }

    return (
        <Card paddingType="none">
            <Column hasDivider>
                {apps.map((app, index) => (
                    <Row
                        key={app.origin}
                        gap={16}
                        padding={16}
                        alignItems="flex-start"
                        data-testid={`@settings/connect-apps/${index}`}
                    >
                        <ConnectAppIcon src={app.manifest?.appIcon} />

                        <Column flex="1">
                            <Row columnGap={12} rowGap={2} flexWrap="wrap">
                                {app.manifest?.appName ? (
                                    <>
                                        <Text>{app.manifest.appName}</Text>
                                        <Text intent="neutral" priority="secondary">
                                            {app.origin}
                                        </Text>
                                    </>
                                ) : (
                                    <Text>{app.origin}</Text>
                                )}

                                {app.process && <ConnectProcessLabel process={app.process} />}
                            </Row>
                            <GroupedPermissionsList
                                permissions={app.allowedPermissions}
                                onRemovePermission={permission => {
                                    dispatch(
                                        connectPopupActions.forgetAppPermission({
                                            origin: app.origin,
                                            permission,
                                        }),
                                    );
                                }}
                            />
                        </Column>

                        <Dropdown
                            data-testid={`@settings/connect-apps/${index}/dropdown`}
                            placement={{ position: 'bottom', alignment: 'end' }}
                            tooltip={{
                                content: <Translation id="TR_SHOW_MORE" />,
                                placement: 'left',
                            }}
                            items={[
                                ...(isDebugModeActive
                                    ? [
                                          {
                                              icon: BellSlashIcon,
                                              iconRight: app.silentMode ? CheckIcon : undefined,
                                              label: (
                                                  <Tooltip
                                                      content={
                                                          <Translation id="TR_CONNECT_APP_SILENT_MODE_DESCRIPTION" />
                                                      }
                                                      placement="left"
                                                      as="span"
                                                  >
                                                      <Translation id="TR_CONNECT_APP_SILENT_MODE" />
                                                  </Tooltip>
                                              ),
                                              'data-testid': `@settings/connect-apps/${index}/silent-mode`,
                                              onClick: () => {
                                                  dispatch(
                                                      connectPopupActions.setAppSilentMode({
                                                          origin: app.origin,
                                                          silentMode: !app.silentMode,
                                                      }),
                                                  );
                                              },
                                          },
                                      ]
                                    : []),
                                {
                                    icon: XCircleIcon,
                                    label: <Translation id="TR_FORGET_ALL_PERMISSIONS" />,
                                    onClick: () => {
                                        dispatch(connectPopupActions.forgetAppPermissions(app));
                                    },
                                },
                            ]}
                        />
                    </Row>
                ))}
            </Column>
        </Card>
    );
};
