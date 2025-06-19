import { useNavigation } from '@react-navigation/native';

import { Box, Button, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import {
    RootStackParamList,
    SendStackParamList,
    SendStackRoutes,
    StackToStackCompositeNavigationProps
} from '@suite-native/navigation';

import { useUtxoSelection } from '../hooks/useUxtoSelection';

type NavigationProps = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendUtxo,
    RootStackParamList
>;

export const SwitchCoinControlButton = ({accountKey}: {accountKey: string}) => {
    const { isCoinControlEnabled, selectedUtxos } = useUtxoSelection();
    const navigation = useNavigation<NavigationProps>();

    const openCoinControlScreen = () => {
        navigation.navigate(SendStackRoutes.SendUtxo, {
            accountKey,
        });
    };

    // TODO add the warning color when the selected UTXOs are not enough for the transaction
    return (
        <Button onPress={openCoinControlScreen} flex={0} colorScheme={isCoinControlEnabled ? 'primary' : 'tertiaryElevation0'}>
            <Box flexDirection="row" alignItems="center"> 
                <Icon size="mediumLarge" color={isCoinControlEnabled ? 'textOnPrimary' : 'textOnTertiary'} name="coins" />
                <Box marginLeft='sp8'>
                    <Text color={isCoinControlEnabled ? 'textOnPrimary' : 'textOnTertiary'}>
                        Select coins
                        {isCoinControlEnabled ? ` • ${selectedUtxos.length}` : ''}
                    </Text>
                </Box>
            </Box>
        </Button>
    );
};
