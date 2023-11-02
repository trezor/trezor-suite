import { useState } from 'react';
import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';
import { useNavigation } from '@react-navigation/native';

import {
    AlertBox,
    Box,
    Button,
    ErrorMessage,
    HeaderedCard,
    TextButton,
    VStack,
} from '@suite-native/atoms';
import { AccountListItem } from '@suite-native/accounts';
import { analytics, EventType } from '@suite-native/analytics';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { useOpenLink } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { TokenReceiveCard } from './TokenReceiveCard';
import { ReceiveAddress } from './ReceiveAddress';
import { ReceiveTextHint } from './ReceiveTextHint';

type AccountReceiveProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    isAccountChangeAllowed?: boolean;
};

const receiveAddressCardStyle = prepareNativeStyle(utils => ({
    minHeight: 440,
    justifyContent: 'center',
    alignItems: 'center',
    padding: utils.spacings.extraLarge,
}));

export const ReceiveAccount = ({
    accountKey,
    tokenContract,
    isAccountChangeAllowed = true,
}: AccountReceiveProps) => {
    const [isAddressVisible, setIsAddressVisible] = useState(false);
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation();
    const openLink = useOpenLink();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (G.isNullable(account))
        return <ErrorMessage errorMessage={`Account ${accountKey} not found.`} />;

    const handleShowAddress = () => {
        analytics.report({
            type: EventType.CreateReceiveAddressShowAddress,
            payload: { assetSymbol: account.symbol },
        });
        setIsAddressVisible(true);
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    const handleOpenEduLink = () => {
        openLink('https://trezor.io/learn/a/verifying-trezor-suite-lite-addresses');
    };

    return (
        <VStack spacing="medium">
            <HeaderedCard
                title="Receive To"
                buttonIcon="discover"
                buttonTitle={isAccountChangeAllowed ? 'Change' : ''}
                onButtonPress={handleGoBack}
            >
                {tokenContract ? (
                    <TokenReceiveCard contract={tokenContract} accountKey={accountKey} />
                ) : (
                    <AccountListItem account={account} />
                )}
            </HeaderedCard>

            {tokenContract && (
                <AlertBox
                    variant="info"
                    title="Your receive address is your Ethereum address."
                    isStandalone
                />
            )}

            <HeaderedCard title="Address" style={applyStyle(receiveAddressCardStyle)}>
                {isAddressVisible ? (
                    <ReceiveAddress accountKey={accountKey} backgroundElevation="1" />
                ) : (
                    <ReceiveTextHint />
                )}
            </HeaderedCard>

            <TextButton size="small" onPress={handleOpenEduLink} iconRight="arrowUpRight">
                Learn more about verifying addresses
            </TextButton>

            {!isAddressVisible && (
                <Box paddingHorizontal="medium">
                    <Button iconLeft="eye" size="large" onPress={handleShowAddress}>
                        Show address
                    </Button>
                </Box>
            )}
        </VStack>
    );
};
