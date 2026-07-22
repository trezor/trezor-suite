import { useNavigation } from '@react-navigation/native';

import { getNetwork } from '@suite-common/wallet-config';
import { useAlert } from '@suite-native/alerts';
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
import { useNetworkBackendForm } from '../hooks/useNetworkBackendForm';

export const NetworkBackendsScreen = ({
    route,
}: StackProps<SettingsStackParamList, SettingsStackRoutes.SettingsNetworkBackends>) => {
    const { showAlert } = useAlert();
    const navigation = useNavigation();

    const network = getNetwork(route.params.networkSymbol);
    const networkBackendForm = useNetworkBackendForm(network);

    const discardChanges = () => {
        networkBackendForm.discard();
        navigation.goBack();
    };

    const closeAction = () => {
        if (networkBackendForm.isDirty) {
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
            <NetworkBackendCard form={networkBackendForm} />
        </Screen>
    );
};
