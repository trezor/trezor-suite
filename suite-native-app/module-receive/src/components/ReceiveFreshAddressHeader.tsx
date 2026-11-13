import { useSelector } from 'react-redux';

import { type TokenAddress } from '@suite-common/tokens';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { parseAccountKey } from '@suite-common/wallet-utils';
import { AccountLabel } from '@suite-native/accounts';
import { HStack, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type CloseActionType,
    ScreenHeader,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { TokenSymbol, type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';

import { ReceiveAddressListButton } from './ReceiveAddressListButton';

type ReceiveFreshAddressHeaderProps = {
    accountKey?: AccountKey;
    tokenContract?: TokenAddress;
    closeActionType: CloseActionType;
};

export const ReceiveFreshAddressHeader = ({
    accountKey,
    tokenContract,
    closeActionType,
}: ReceiveFreshAddressHeaderProps) => {
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    // Case-insensitive lookup; the stored contract is what the token metadata is keyed by.
    const token = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenContract),
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
                    <HStack spacing={0} alignItems="center">
                        <AccountLabel
                            variant="body-md-strong"
                            accountDescriptor={accountDescriptor}
                            networkSymbol={networkSymbol}
                            deviceStaticSessionId={deviceStaticSessionId}
                            showAccountTypeBadge
                        />
                        {token?.symbol && (
                            <HStack alignItems="center" spacing={0} flexShrink={1}>
                                <Text variant="body-md-strong">{' - '}</Text>
                                <TokenSymbol
                                    networkSymbol={networkSymbol}
                                    contractAddress={token.contract}
                                    variant="body-md-strong"
                                    testID="@receive/header-token-symbol"
                                />
                            </HStack>
                        )}
                    </HStack>
                </>
            }
            closeActionType={closeActionType}
            closeAction={closeActionType === 'close' ? navigateToInitialScreen : undefined}
            rightIcon={
                <ReceiveAddressListButton accountKey={accountKey} tokenContract={tokenContract} />
            }
        />
    );
};
