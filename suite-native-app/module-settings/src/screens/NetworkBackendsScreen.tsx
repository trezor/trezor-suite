import { useNavigation } from '@react-navigation/native';

import { getNetwork } from '@suite-common/wallet-config';
import { useAlert } from '@suite-native/alerts';
import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DynamicScreenHeader,
    Screen,
    type SettingsStackParamList,
    type SettingsStackRoutes,
    type StackProps,
} from '@suite-native/navigation';

import { ConnectionInfoButton } from '../components/ConnectionInfoButton';
import { NetworkBackendCard } from '../components/NetworkBackendCard';
import { NetworkExplorerCard } from '../components/NetworkExplorerCard';
import { useNetworkBackendForm } from '../hooks/useNetworkBackendForm';
import { useNetworkExplorerForm } from '../hooks/useNetworkExplorerForm';

export const NetworkBackendsScreen = ({
    route,
}: StackProps<SettingsStackParamList, SettingsStackRoutes.SettingsNetworkBackends>) => {
    const { showAlert } = useAlert();
    const navigation = useNavigation();

    const network = getNetwork(route.params.networkSymbol);
    const networkBackendForm = useNetworkBackendForm(network);
    const networkExplorerForm = useNetworkExplorerForm(network);

    const discardChanges = () => {
        networkBackendForm.discard();
        navigation.goBack();
    };

    const closeAction = () => {
        if (networkBackendForm.isDirty || networkExplorerForm.isDirty) {
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
            focusedInputBottomOffset={123} // ensures the input below the focused one is also visible
        >
            <VStack spacing="sp16">
                <NetworkBackendCard form={networkBackendForm} />
                <NetworkExplorerCard form={networkExplorerForm} />
            </VStack>
        </Screen>
    );
};
