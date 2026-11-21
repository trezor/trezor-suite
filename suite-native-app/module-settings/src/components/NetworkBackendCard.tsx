import type { ServerType } from '@suite-common/wallet-config';
import { Badge, Button, Select } from '@suite-native/atoms';
import { Form, TextInputField } from '@suite-native/forms';
import { Translation, useTranslate } from '@suite-native/intl';

import { SettingsFormCard } from './SettingsFormCard';
import { type NetworkBackendForm } from '../hooks/useNetworkBackendForm';

type NetworkBackendCardProps = {
    form: NetworkBackendForm;
};

type StatusBadgeProps = {
    isConnected: boolean;
};

const StatusBadge = ({ isConnected }: StatusBadgeProps) =>
    isConnected ? (
        <Badge
            label={<Translation id="moduleSettings.networkBackends.server.status.connected" />}
            intent="brand"
        />
    ) : (
        <Badge
            label={<Translation id="moduleSettings.networkBackends.server.status.disconnected" />}
            intent="critical"
        />
    );

export const NetworkBackendCard = ({ form }: NetworkBackendCardProps) => {
    const {
        hookForm,
        isDirty,
        serverTypes,
        selectedServerType,
        setServerType,
        serverAddressExample,
        isNetworkEnabled,
        isConnected,
        isConnecting,
        submit,
    } = form;
    const { translate } = useTranslate();

    // A disabled network never connects, so its status would always read as disconnected.
    const isStatusShown = isNetworkEnabled && !isDirty;
    const isConnectButtonShown = isDirty || (isNetworkEnabled && !isConnected);

    return (
        <SettingsFormCard
            icon="database"
            title={<Translation id="moduleSettings.networkBackends.server.title" />}
            badge={isStatusShown && <StatusBadge isConnected={isConnected} />}
        >
            <Form form={hookForm}>
                <Select<ServerType>
                    title={
                        <Translation id="moduleSettings.networkBackends.server.serverType.label" />
                    }
                    items={serverTypes}
                    value={selectedServerType}
                    onSelectItem={setServerType}
                    labelType="innerLabel"
                />
                {selectedServerType !== 'default' && (
                    <TextInputField
                        name="serverAddress"
                        label={translate(
                            'moduleSettings.networkBackends.server.serverAddress.label',
                        )}
                        hint={translate(
                            'moduleSettings.networkBackends.server.serverAddress.hint',
                            { example: serverAddressExample },
                        )}
                        autoCapitalize="none"
                        keyboardType="url"
                    />
                )}
                {isConnectButtonShown && (
                    <Button onPress={() => submit()} isLoading={isConnecting}>
                        <Translation id="moduleSettings.networkBackends.server.connectButton" />
                    </Button>
                )}
            </Form>
        </SettingsFormCard>
    );
};
