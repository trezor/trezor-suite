import { TouchableOpacity } from 'react-native';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import { connectPopupActions, selectConnectAppPermissions } from '@suite-common/connect-popup';
import { AppRememberedPermission } from '@suite-common/connect-popup/src/connectPopupTypes';
import { AnimatedBox, Button, Card, CardDivider, HStack, Text, VStack } from '@suite-native/atoms';
import { AccordionContent } from '@suite-native/atoms/src/Accordion/AccordionContent';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { ConnectAppIcon } from '../components/ConnectAppIcon';

const PermissionDetailCard = ({ app }: { app: AppRememberedPermission }) => {
    const dispatch = useDispatch();
    const handleDisconnect = () => {
        dispatch(connectPopupActions.forgetAppPermissions(app));
    };
    const isExpanded = useSharedValue(false);
    const animatedChevronStyle = useAnimatedStyle(() => ({
        transform: [
            {
                rotate: withTiming(`${isExpanded.value ? -180 : 0}deg`, {
                    duration: 200,
                }),
            },
        ],
    }));

    return (
        <Card>
            <VStack spacing={0}>
                <TouchableOpacity onPress={() => (isExpanded.value = !isExpanded.value)}>
                    <HStack spacing="sp12" alignItems="center">
                        <ConnectAppIcon
                            src={app.manifest?.appIcon}
                            type="trezorConnect"
                            size="medium"
                        />
                        <VStack flex={1} spacing="sp1">
                            <Text numberOfLines={1}>{app.manifest?.appName ?? app.origin}</Text>
                            {app.manifest?.appName && (
                                <Text color="textSubdued" numberOfLines={1}>
                                    {app.origin}
                                </Text>
                            )}
                        </VStack>
                        <AnimatedBox style={animatedChevronStyle}>
                            <Icon name="caretDown" size="mediumLarge" />
                        </AnimatedBox>
                    </HStack>
                </TouchableOpacity>
                <AccordionContent isOpened={isExpanded}>
                    <VStack spacing="sp16" paddingTop="sp16">
                        <CardDivider />
                        <Button onPress={handleDisconnect} colorScheme="tertiaryElevation0">
                            <Translation id="moduleConnectPopup.trezorConnect.forget" />
                        </Button>
                    </VStack>
                </AccordionContent>
            </VStack>
        </Card>
    );
};

export const ConnectPermissionsScreen = () => {
    const apps = useSelector(selectConnectAppPermissions);

    return (
        <Screen
            header={
                <ScreenHeader
                    closeActionType="close"
                    content={
                        <Text>
                            <Translation id="moduleConnectPopup.trezorConnect.title" />
                        </Text>
                    }
                />
            }
        >
            <VStack
                spacing="sp24"
                justifyContent={apps.length === 0 ? 'center' : 'flex-start'}
                flex={1}
            >
                {apps.map(app => (
                    <PermissionDetailCard key={app.origin} app={app} />
                ))}
                {apps.length === 0 && (
                    <>
                        <Text textAlign="center" variant="titleSmall">
                            <Translation id="moduleConnectPopup.noConnectedApps" />
                        </Text>
                        <Text textAlign="center" color="textSubdued">
                            <Translation id="moduleConnectPopup.noConnectedAppsDescription" />
                        </Text>
                    </>
                )}
            </VStack>
        </Screen>
    );
};
