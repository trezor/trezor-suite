import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    selectAccountLabel,
    selectAccountNetworkSymbol,
} from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { HStack, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    CloseActionType,
    GoBackIcon,
    ScreenHeader,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { TokensRootState, selectAccountTokenSymbol } from '@suite-native/tokens';
import TrezorConnect from '@trezor/connect';

type ReceiveScreenHeaderProps = {
    accountKey?: AccountKey;
    tokenContract?: TokenAddress;
    closeActionType: CloseActionType;
};

export const ReceiveScreenHeader = ({
    accountKey,
    tokenContract,
    closeActionType,
}: ReceiveScreenHeaderProps) => {
    const navigation = useNavigation();
    const navigateToInitialScreen = useNavigateToInitialScreen();

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
                                values={{ coinSymbol: getNetworkDisplaySymbol(symbol) }}
                            />
                        ) : (
                            <Translation id="moduleReceive.receiveTitle" />
                        )}
                    </Text>
                    <HStack spacing="sp8" alignItems="center">
                        {accountLabel && (
                            <Text variant="highlight">
                                {accountLabel}
                                {tokenSymbol && ` - ${tokenSymbol}`}
                            </Text>
                        )}
                    </HStack>
                </>
            }
            leftIcon={
                <GoBackIcon
                    closeActionType={closeActionType}
                    closeAction={closeActionType === 'close' ? navigateToInitialScreen : undefined}
                />
            }
        />
    );
};
