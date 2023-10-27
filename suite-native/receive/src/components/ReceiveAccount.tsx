import { useState } from 'react';
import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';

import {
    AlertBox,
    Box,
    Text,
    Button,
    Card,
    ErrorMessage,
    TextButton,
    VStack,
} from '@suite-native/atoms';
import { AccountListItem } from '@suite-native/accounts';
import { analytics, EventType } from '@suite-native/analytics';
import {
    AccountsRootState,
    selectAccountByKey,
    selectIsSelectedDeviceImported,
} from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { useOpenLink } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { AddressQRCode } from '@suite-native/qr-code';

import { TokenReceiveCard } from './TokenReceiveCard';
import { UnverifiedAddressSection } from './UnverifiedAddressSection';
import { useFreshAccountAddress } from '../hooks/useFreshAccountAddress';

type AccountReceiveProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

const receiveAddressCardStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    padding: utils.spacings.extraLarge,
}));

const AccountDetailCard = ({ accountKey, tokenContract }: AccountReceiveProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (G.isNullable(account))
        return <ErrorMessage errorMessage={`Account ${accountKey} not found.`} />;

    return (
        <VStack spacing="medium">
            {tokenContract && (
                <AlertBox title="Your receive address is your Ethereum address." isIconVisible />
            )}
            <Card>
                {tokenContract ? (
                    <TokenReceiveCard contract={tokenContract} accountKey={accountKey} />
                ) : (
                    <AccountListItem account={account} />
                )}
            </Card>
        </VStack>
    );
};

export const ReceiveAccount = ({ accountKey, tokenContract }: AccountReceiveProps) => {
    const [isAddressQRVisible, setIsAddressQRVisible] = useState(false);
    const [isAddressVisible, setIsAddressVisible] = useState(false);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const { applyStyle } = useNativeStyles();
    const openLink = useOpenLink();

    const { address, verifyAddress } = useFreshAccountAddress(accountKey);

    // const isPortfolioTracker = useSelector(selectIsSelectedDeviceImported);
    const isPortfolioTracker = false;

    const isAccountDetailVisible = !isAddressQRVisible && !isAddressVisible;

    if (G.isNullable(account) || G.isNullable(address))
        return <ErrorMessage errorMessage="Something went wrong" />;

    const handleShowAddress = async () => {
        if (isPortfolioTracker) {
            analytics.report({
                type: EventType.CreateReceiveAddressShowAddress,
                payload: { assetSymbol: account.symbol },
            });
            setIsAddressQRVisible(true);
        } else {
            setIsAddressVisible(true);
            const wasVerificationSuccessful = await verifyAddress();

            if (wasVerificationSuccessful) {
                setIsAddressQRVisible(true);
            } else {
                // TODO: handle cancel flow
            }
        }
    };

    const handleOpenEduLink = () => {
        openLink('https://trezor.io/learn/a/verifying-trezor-suite-lite-addresses');
    };

    return (
        <VStack spacing="medium">
            {isAccountDetailVisible && (
                <AccountDetailCard accountKey={accountKey} tokenContract={tokenContract} />
            )}

            <Card status="success" statusMessage="Ethereum address">
                <Box style={applyStyle(receiveAddressCardStyle)}>
                    {isAddressQRVisible ? (
                        <AddressQRCode address={address} />
                    ) : (
                        <UnverifiedAddressSection
                            address={address}
                            isAddressVisible={isAddressVisible}
                        />
                    )}
                </Box>

                {!isAddressQRVisible && !isAddressVisible && (
                    <VStack spacing="large" paddingHorizontal="medium">
                        <Button iconLeft="eye" size="large" onPress={handleShowAddress}>
                            {/* TODO: translate */}
                            Show address
                        </Button>
                        <TextButton
                            size="small"
                            onPress={handleOpenEduLink}
                            iconRight="arrowUpRight"
                        >
                            {/* TODO: translate */}
                            Learn more about verifying addresses
                        </TextButton>
                    </VStack>
                )}
            </Card>

            {!isPortfolioTracker && isAddressVisible && !isAddressQRVisible && (
                <Text>Confirm on Trezor</Text>
            )}

            {/* TODO: isDevice And UnconfirmedAddress is Visible ==> SHOW the connect image */}
        </VStack>
    );
};
