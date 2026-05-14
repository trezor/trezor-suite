import { useSelector } from 'react-redux';

import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { parseAccountKey } from '@suite-common/wallet-utils';
import { HStack, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { AccountLabel } from '@suite-native/labeling';
import {
    type CloseActionType,
    ScreenHeader,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { type TokensRootState, selectAccountTokenSymbol } from '@suite-native/tokens';

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
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const tokenSymbol = useSelector((state: TokensRootState) =>
        selectAccountTokenSymbol(state, accountKey, tokenContract),
    );

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
