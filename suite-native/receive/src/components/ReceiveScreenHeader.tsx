import { useSelector } from 'react-redux';

import { useNavigation, usePreventRemove } from '@react-navigation/native';

import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { parseAccountKey } from '@suite-common/wallet-utils';
import { HStack, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { AccountLabel } from '@suite-native/labeling';
import {
    CloseActionType,
    ScreenHeader,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { TokensRootState, selectAccountTokenSymbol } from '@suite-native/tokens';
import TrezorConnect from '@trezor/connect';

type ReceiveScreenHeaderProps = {
    accountKey?: AccountKey;
    tokenContract?: TokenAddress;
    closeActionType: CloseActionType;
    onLeave?: () => void;
};

export const ReceiveScreenHeader = ({
    accountKey,
    tokenContract,
    closeActionType,
    onLeave,
}: ReceiveScreenHeaderProps) => {
    const navigation = useNavigation();
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const tokenSymbol = useSelector((state: TokensRootState) =>
        selectAccountTokenSymbol(state, accountKey, tokenContract),
    );

    usePreventRemove(true, ({ data }) => {
        TrezorConnect.cancel();

        navigation.dispatch(data.action);

        onLeave?.();
    });

    if (accountKey === undefined) {
        return null;
    }

    const { accountDescriptor, networkSymbol, deviceStaticSessionId } = parseAccountKey(accountKey);

    return (
        <ScreenHeader
            customContent={
                <>
                    <Text variant="body-md-strong">
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
                        <Text variant="body-md-strong">
                            <AccountLabel
                                accountDescriptor={accountDescriptor}
                                networkSymbol={networkSymbol}
                                deviceStaticSessionId={deviceStaticSessionId}
                            />
                            {tokenSymbol && ` - ${tokenSymbol}`}
                        </Text>
                    </HStack>
                </>
            }
            closeActionType={closeActionType}
            closeAction={closeActionType === 'close' ? navigateToInitialScreen : undefined}
        />
    );
};
