import { useNavigation } from '@react-navigation/native';

import { useAlert } from '@suite-native/alerts';
import { Button, Card, HStack, InlineAlertText, Select, Text, VStack } from '@suite-native/atoms';
import { Form, TextInputField } from '@suite-native/forms';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { ConnectionInfoButton } from '../components/ConnectionInfoButton';
import { type ServerType, useBackendServersForm } from '../hooks/useBackendServersForm';

export const BitcoinBackendsScreen = () => {
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const navigation = useNavigation();

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
                title: (
                    <Translation id="moduleSettings.advanced.bitcoinBackends.closeAction.title" />
                ),
                description: (
                    <Translation id="moduleSettings.advanced.bitcoinBackends.closeAction.description" />
                ),
                primaryButtonTitle: (
                    <Translation id="moduleSettings.advanced.bitcoinBackends.closeAction.discardButton" />
                ),
                primaryButtonVariant: 'redBold',
                onPressPrimaryButton: discardChanges,
                secondaryButtonTitle: (
                    <Translation id="moduleSettings.advanced.bitcoinBackends.closeAction.continueEditingButton" />
                ),
                secondaryButtonVariant: 'redElevation0',
            });
        } else {
            navigation.goBack();
        }
    };

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={<Translation id="moduleSettings.advanced.bitcoinBackends.title" />}
                    subtitle={
                        <Translation id="moduleSettings.advanced.bitcoinBackends.description" />
                    }
                    rightIcon={<ConnectionInfoButton />}
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
                                <Translation id="moduleSettings.advanced.bitcoinBackends.servers.title" />
                            </Text>
                        </HStack>
                        {!isDirty &&
                            (isConnected ? (
                                <InlineAlertText variant="success">
                                    <Translation id="moduleSettings.advanced.bitcoinBackends.servers.status.connected" />
                                </InlineAlertText>
                            ) : (
                                <InlineAlertText variant="critical">
                                    <Translation id="moduleSettings.advanced.bitcoinBackends.servers.status.disconnected" />
                                </InlineAlertText>
                            ))}
                    </HStack>
                    <Form form={form}>
                        <Select<ServerType>
                            title={
                                <Translation id="moduleSettings.advanced.bitcoinBackends.servers.serverType" />
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
                                    'moduleSettings.advanced.bitcoinBackends.servers.serverAddress',
                                )}
                                autoCapitalize="none"
                                keyboardType="url"
                            />
                        )}
                        {(isDirty || !isConnected) && (
                            <Button onPress={submit} isLoading={isConnecting}>
                                <Translation id="moduleSettings.advanced.bitcoinBackends.servers.connectButton" />
                            </Button>
                        )}
                    </Form>
                </VStack>
            </Card>
        </Screen>
    );
};
