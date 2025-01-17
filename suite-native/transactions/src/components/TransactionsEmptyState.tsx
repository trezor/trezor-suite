import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, Text, VStack } from '@suite-native/atoms';
import { selectHasFirmwareAuthenticityCheckHardFailed } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    ReceiveStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

import { NoTransactionsSvg } from './NoTransactionsSvg';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.AccountDetail>;

export const TransactionsEmptyState = ({ accountKey }: { accountKey: string }) => {
    const navigation = useNavigation<NavigationProp>();
    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailed,
    );
    const showReceiveButton = !hasFirmwareAuthenticityCheckHardFailed;

    const handleReceive = () => {
        navigation.navigate(RootStackRoutes.ReceiveStack, {
            screen: ReceiveStackRoutes.ReceiveAccount,
            params: {
                accountKey,
                closeActionType: 'close',
            },
        });
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
            {showReceiveButton && (
                <Button viewLeft="arrowLineDown" onPress={handleReceive} size="large">
                    <Translation id="transactions.emptyState.button" />
                </Button>
            )}
        </VStack>
    );
};
