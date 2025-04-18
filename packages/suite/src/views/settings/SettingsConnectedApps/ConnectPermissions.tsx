import styled from 'styled-components';

import { connectPopupActions, selectConnectAppPermissions } from '@suite-common/connect-popup';
import { Card, Column, Dropdown, H3, IconCircle, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { ConnectProcessLabel } from 'src/components/suite/ConnectProcessLabel';
import { useDispatch, useSelector } from 'src/hooks/suite';

const PermissionsList = styled.ul`
    list-style: disc;
    margin-left: 16px;
`;

export const getPermissionText = (permissionType: string) => {
    switch (permissionType) {
        case 'read':
            return <Translation id="TR_PERMISSION_READ" />;
        case 'write':
            return <Translation id="TR_PERMISSION_WRITE" />;
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

export const ConnectPermissions = () => {
    const dispatch = useDispatch();
    const apps = useSelector(selectConnectAppPermissions);

    if (apps.length === 0) {
        return (
            <Column flex="1" justifyContent="center" gap={spacings.xs}>
                <H3 align="center">
                    <Translation id="TR_NO_CONNECTED_APPS" />
                </H3>
                <Text
                    align="center"
                    variant="tertiary"
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
                        <IconCircle
                            name="plugs"
                            size={spacings.xxl}
                            paddingType="small"
                            variant="tertiary"
                            hasBorder={false}
                        />

                        <Column flex="1">
                            <Row gap={spacings.sm}>
                                {app.manifest?.appName ? (
                                    <>
                                        <Text>{app.manifest.appName}</Text>
                                        <Text variant="tertiary">{app.origin}</Text>
                                    </>
                                ) : (
                                    <Text>{app.origin}</Text>
                                )}

                                {app.process && <ConnectProcessLabel process={app.process} />}
                            </Row>
                            <Text variant="tertiary">
                                <PermissionsList>
                                    {app.types.map(permission => (
                                        <li key={permission}>{getPermissionText(permission)}</li>
                                    ))}
                                </PermissionsList>
                            </Text>
                        </Column>

                        <Dropdown
                            data-testid={`@settings/connect-apps/${index}/dropdown`}
                            placement={{ position: 'bottom', alignment: 'end' }}
                            items={[
                                {
                                    key: 'group1',
                                    options: [
                                        {
                                            icon: 'xCircle',
                                            label: <Translation id="TR_FORGET" />,
                                            onClick: () => {
                                                dispatch(
                                                    connectPopupActions.forgetAppPermissions(app),
                                                );
                                            },
                                        },
                                    ],
                                },
                            ]}
                        />
                    </Row>
                ))}
            </Column>
        </Card>
    );
};
