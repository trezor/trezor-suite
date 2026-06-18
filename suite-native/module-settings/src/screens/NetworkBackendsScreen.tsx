import { useNavigation } from '@react-navigation/native';

import { getNetwork } from '@suite-common/wallet-config';
import { useAlert } from '@suite-native/alerts';
import { Button, Card, HStack, InlineAlertText, Select, Text, VStack } from '@suite-native/atoms';
import { Form, TextInputField } from '@suite-native/forms';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    DynamicScreenHeader,
    Screen,
    type SettingsStackParamList,
    type SettingsStackRoutes,
    type StackProps,
} from '@suite-native/navigation';

import { ConnectionInfoButton } from '../components/ConnectionInfoButton';
import { type ServerType, useBackendServersForm } from '../hooks/useBackendServersForm';

export const NetworkBackendsScreen = ({
    route,
}: StackProps<SettingsStackParamList, SettingsStackRoutes.SettingsNetworkBackends>) => {
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const navigation = useNavigation();

    const network = getNetwork(route.params.networkSymbol);
    const { form, serverTypes, isConnected, isConnecting, submit, discard } =
        useBackendServersForm();

    const { isDirty } = form.formState;
    const serverType = form.watch('serverType');
    const setServerType = (value: ServerType) =>
        form.setValue('serverType', value, { shouldDirty: true });

    const discardChanges = () => {
        discard();
        navigation.goBack();
    };

    const closeAction = () => {
        if (isDirty) {
            showAlert({
                title: <Translation id="moduleSettings.networkBackends.closeAction.title" />,
                description: (
                    <Translation id="moduleSettings.networkBackends.closeAction.description" />
                ),
                primaryButtonTitle: (
                    <Translation id="moduleSettings.networkBackends.closeAction.discardButton" />
                ),
                primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
                onPressPrimaryButton: discardChanges,
                secondaryButtonTitle: (
                    <Translation id="moduleSettings.networkBackends.closeAction.continueEditingButton" />
                ),
                secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
            });
        } else {
            navigation.goBack();
        }
    };

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={
                        <Translation
                            id="moduleSettings.networkBackends.title"
                            values={{ networkName: network.name }}
                        />
                    }
                    subtitle={<Translation id="moduleSettings.networkBackends.description" />}
                    rightIcon={<ConnectionInfoButton network={network} />}
                    closeAction={closeAction}
                />
            }
        >
            <Card>
                <VStack spacing="sp16">
                    <HStack alignItems="center" justifyContent="space-between">
                        <HStack>
                            <Icon name="database" size="mediumLarge" />
                            <Text variant="body-md">
                                <Translation id="moduleSettings.networkBackends.servers.title" />
                            </Text>
                        </HStack>
                        {!isDirty &&
                            (isConnected ? (
                                <InlineAlertText variant="success">
                                    <Translation id="moduleSettings.networkBackends.servers.status.connected" />
                                </InlineAlertText>
                            ) : (
                                <InlineAlertText variant="critical">
                                    <Translation id="moduleSettings.networkBackends.servers.status.disconnected" />
                                </InlineAlertText>
                            ))}
                    </HStack>
                    <Form form={form}>
                        <Select<ServerType>
                            title={
                                <Translation id="moduleSettings.networkBackends.servers.serverType" />
                            }
                            items={serverTypes}
                            value={serverType}
                            onSelectItem={setServerType}
                            isLabelShown
                        />
                        {serverType === 'electrum' && (
                            <TextInputField
                                name="serverAddress"
                                label={translate(
                                    'moduleSettings.networkBackends.servers.serverAddress',
                                )}
                                autoCapitalize="none"
                                keyboardType="url"
                            />
                        )}
                        {(isDirty || !isConnected) && (
                            <Button onPress={submit} isLoading={isConnecting}>
                                <Translation id="moduleSettings.networkBackends.servers.connectButton" />
                            </Button>
                        )}
                    </Form>
                </VStack>
            </Card>
        </Screen>
    );
};
