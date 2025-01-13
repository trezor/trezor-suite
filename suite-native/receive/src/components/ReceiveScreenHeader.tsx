import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import {
    AccountsRootState,
    selectAccountLabel,
    selectAccountNetworkSymbol,
} from '@suite-common/wallet-core';
import { HStack, Text } from '@suite-native/atoms';
import { CryptoIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    GoBackIcon,
    RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
} from '@suite-native/navigation';
import { selectAccountTokenSymbol, TokensRootState } from '@suite-native/tokens';
import TrezorConnect from '@trezor/connect';

type ReceiveScreenHeaderProps = {
    accountKey?: AccountKey;
    tokenContract?: TokenAddress;
};

export const ReceiveScreenHeader = ({ accountKey, tokenContract }: ReceiveScreenHeaderProps) => {
    const {
        params: { closeActionType },
    } = useRoute<RouteProp<RootStackParamList, RootStackRoutes.ReceiveModal>>();
    const navigation = useNavigation();
    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const tokenSymbol = useSelector((state: TokensRootState) =>
        selectAccountTokenSymbol(state, accountKey, tokenContract),
    );

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', () => {
            // When leaving the screen, cancel the request for address on trezor device
            TrezorConnect.cancel();
        });

        return unsubscribe;
    }, [navigation]);

    return (
        <ScreenHeader
            content={
                <>
                    <Text variant="highlight">
                        {symbol ? (
                            <Translation
                                id="moduleReceive.screenTitle"
                                values={{ coinSymbol: symbol.toUpperCase() }}
                            />
                        ) : (
                            <Translation id="moduleReceive.receiveTitle" />
                        )}
                    </Text>
                    <HStack spacing="sp8" alignItems="center">
                        {symbol && <CryptoIcon symbol={symbol} size="extraSmall" />}
                        {accountLabel && (
                            <Text variant="highlight">
                                {accountLabel}
                                {tokenSymbol && ` - ${tokenSymbol}`}
                            </Text>
                        )}
                    </HStack>
                </>
            }
            leftIcon={<GoBackIcon closeActionType={closeActionType} />}
        />
    );
};
