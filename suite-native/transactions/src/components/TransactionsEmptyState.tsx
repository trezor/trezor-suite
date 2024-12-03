import { useNavigation } from '@react-navigation/native';

import { Box, Button, Text, VStack } from '@suite-native/atoms';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { Translation } from '@suite-native/intl';

import { NoTransactionsSvg } from './NoTransactionsSvg';

export const TransactionsEmptyState = ({ accountKey }: { accountKey: string }) => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.ReceiveModal>>();

    const handleReceive = () => {
        navigation.navigate(RootStackRoutes.ReceiveModal, { accountKey, closeActionType: 'back' });
    };

    return (
        <VStack marginHorizontal="sp16" spacing="sp32">
            <Box alignItems="center">
                <NoTransactionsSvg />
                <VStack alignItems="center">
                    <Text textAlign="center" variant="titleSmall">
                        <Translation id="transactions.emptyState.title" />
                    </Text>
                    <Text textAlign="center" color="textSubdued">
                        <Translation id="transactions.emptyState.subtitle" />
                    </Text>
                </VStack>
            </Box>
            <Button viewLeft="arrowLineDown" onPress={handleReceive} size="large">
                <Translation id="transactions.emptyState.button" />
            </Button>
        </VStack>
    );
};
