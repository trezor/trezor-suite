import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    selectAccountDescriptor,
    selectAccountDeviceState,
    selectAccountNetworkSymbol,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';

import { ReceiveAddressDetails } from './ReceiveAddressDetails';
import { ReceiveAddressInfo } from './ReceiveAddressInfo';

type ReceiveAddressCardProps = {
    accountKey: AccountKey;
    address: string;
    tokenContract?: TokenAddress;
};

export const ReceiveAddressCard = ({
    accountKey,
    address,
    tokenContract,
}: ReceiveAddressCardProps) => {
    const token = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenContract),
    );
    const accountDescriptor = useSelector((state: AccountsRootState) =>
        selectAccountDescriptor(state, accountKey),
    );
    const deviceStaticSessionId = useSelector((state: AccountsRootState) =>
        selectAccountDeviceState(state, accountKey),
    );
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    if (!accountDescriptor || !deviceStaticSessionId || !symbol) {
        return null;
    }

    const isTokenAddress = tokenContract !== undefined;

    return (
        <VStack spacing="sp16" flex={1}>
            <ReceiveAddressDetails
                accountDescriptor={accountDescriptor}
                address={address}
                deviceStaticSessionId={deviceStaticSessionId}
                networkSymbol={symbol}
                tokenContract={tokenContract}
                tokenSymbol={token?.symbol || token?.name}
                showLabelEdit={!isTokenAddress}
            />
            <ReceiveAddressInfo networkSymbol={symbol} isTokenAddress={isTokenAddress} />
        </VStack>
    );
};
