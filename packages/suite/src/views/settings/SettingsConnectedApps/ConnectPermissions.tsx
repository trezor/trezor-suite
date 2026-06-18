import styled from 'styled-components';

import { selectIsDebugModeActive } from '@suite/debug';
import { Translation } from '@suite/intl';
import {
    connectPopupActions,
    groupPermissionsByCoin,
    selectConnectAppPermissions,
} from '@suite-common/connect-popup';
import { Card, Column, Dropdown, H3, IconButton, Row, Text, Tooltip } from '@trezor/components';
import { type MethodPermission, type PermissionRequest } from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { ConnectAppIcon } from 'src/components/suite/ConnectAppIcon';
import { ConnectProcessLabel } from 'src/components/suite/ConnectProcessLabel';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { getCoinLabel } from 'src/utils/suite/connectPermissions';

const PermissionsList = styled.ul`
    list-style: disc;
    margin-left: 16px;
`;

export const getPermissionText = (permissionType: MethodPermission | string) => {
    switch (permissionType) {
        case 'read_address':
            return <Translation id="TR_PERMISSION_READ_ADDRESS" />;
        case 'read_xpub':
            return <Translation id="TR_PERMISSION_READ_XPUB" />;
        case 'read_account_info':
            return <Translation id="TR_PERMISSION_READ_ACCOUNT_INFO" />;
        case 'read_settings':
            return <Translation id="TR_PERMISSION_READ_SETTINGS" />;
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

type GroupedPermissionsListProps = {
    permissions: PermissionRequest[];
    onRemovePermission?: (permission: PermissionRequest) => void;
};

export const GroupedPermissionsList = ({
    permissions,
    onRemovePermission,
}: GroupedPermissionsListProps) => (
    <PermissionsList>
        {groupPermissionsByCoin(permissions).map(group => (
            <li key={group.coin ?? '__device__'}>
                <Text>
                    {group.coin ? getCoinLabel(group.coin) : <Translation id="TR_DEVICE" />}
                </Text>
                <PermissionsList>
                    {group.permissions.map(permission => (
                        <li key={permission}>
                            {onRemovePermission ? (
                                <Row gap={spacings.xs} alignItems="center">
                                    <Text>{getPermissionText(permission)}</Text>
                                    <IconButton
                                        icon="xCircle"
                                        size="small"
                                        intent="neutral"
                                        priority="secondary"
                                        tooltip={{
                                            content: <Translation id="TR_FORGET_PERMISSION" />,
                                            placement: 'left',
                                        }}
                                        onClick={() =>
                                            onRemovePermission({ permission, coin: group.coin })
                                        }
                                    />
                                </Row>
                            ) : (
                                getPermissionText(permission)
                            )}
                        </li>
                    ))}
                </PermissionsList>
            </li>
        ))}
    </PermissionsList>
);

export const ConnectPermissions = () => {
    const dispatch = useDispatch();
    const apps = useSelector(selectConnectAppPermissions);
    const isDebugModeActive = useSelector(selectIsDebugModeActive);

    if (apps.length === 0) {
        return (
            <Column flex="1" justifyContent="center" gap={spacings.xs}>
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
                        gap={spacings.md}
                        padding={spacings.md}
                        data-testid={`@settings/connect-apps/${index}`}
                    >
                        <ConnectAppIcon src={app.manifest?.appIcon} />

                        <Column flex="1">
                            <Row columnGap={spacings.sm} rowGap={spacings.xxxs} flexWrap="wrap">
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
                            <Text intent="neutral" priority="secondary">
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
                            </Text>
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
                                              icon: 'bellSlash' as const,
                                              iconRight: app.silentMode
                                                  ? ('check' as const)
                                                  : undefined,
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
                                    icon: 'xCircle',
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
