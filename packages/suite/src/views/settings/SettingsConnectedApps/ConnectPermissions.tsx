import { connectPopupActions, selectConnectAppPermissions } from '@suite-common/connect-popup';
import { Badge, Column, Dropdown, IconCircle, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const ConnectPermissions = () => {
    const dispatch = useDispatch();
    const apps = useSelector(selectConnectAppPermissions);

    if (apps.length === 0) {
        return (
            <Row padding={spacings.xl} justifyContent="center">
                <Text align="center" variant="tertiary">
                    <Translation id="TR_NO_CONNECTED_APPS" />
                </Text>
            </Row>
        );
    }

    return (
        <>
            <Column flex="1" hasDivider>
                {apps.map(app => (
                    <Row key={app.origin} gap={spacings.md} padding={spacings.md}>
                        <IconCircle
                            name="appWindow"
                            size={spacings.xxl}
                            paddingType="small"
                            variant="tertiary"
                            hasBorder={false}
                        />

                        <Column flex="1">
                            <Row gap={spacings.sm}>
                                <Text>{app.origin}</Text>
                                <Badge variant="tertiary">{app.processName}</Badge>
                            </Row>
                            <Text variant="tertiary">Permissions: {app.types.join(', ')}</Text>
                        </Column>

                        <Dropdown
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
        </>
    );
};
