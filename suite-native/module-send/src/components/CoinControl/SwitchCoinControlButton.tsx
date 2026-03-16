import { useMemo } from 'react';

import { useNavigation } from '@react-navigation/native';

import { type AccountKey } from '@suite-common/wallet-types';
import { Button, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    type SendStackParamList,
    SendStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

import { useUtxoSelection } from '../../hooks/useUtxoSelection';

type NavigationProps = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendUtxo,
    RootStackParamList
>;

type SwitchCoinControlButtonProps = {
    accountKey: AccountKey;
    amount?: string;
};

export const SwitchCoinControlButton = ({ accountKey, amount }: SwitchCoinControlButtonProps) => {
    const { selectedUtxos, totalSelectedAmount, isCoinControlEnabled } =
        useUtxoSelection(accountKey);
    const navigation = useNavigation<NavigationProps>();

    const isMissingUtxos = isCoinControlEnabled && amount && totalSelectedAmount.isLessThan(amount);

    const openCoinControlScreen = () => {
        navigation.navigate(SendStackRoutes.SendUtxo, {
            accountKey,
            amount,
        });
    };

    const colorScheme = useMemo(() => {
        if (isCoinControlEnabled) {
            return isMissingUtxos ? 'yellowBold' : 'primary';
        }

        return 'tertiaryElevation0';
    }, [isCoinControlEnabled, isMissingUtxos]);

    const textColor = isCoinControlEnabled && !isMissingUtxos ? 'textOnPrimary' : 'textOnTertiary';

    return (
        <Button
            testID="switch-coin-control-button"
            onPress={openCoinControlScreen}
            colorScheme={colorScheme}
            viewLeft="coins"
        >
            <Text color={textColor}>
                <Translation id="moduleSend.coinControl.cta" />
                {isCoinControlEnabled ? ` • ${selectedUtxos.length}` : ''}
            </Text>
        </Button>
    );
};
