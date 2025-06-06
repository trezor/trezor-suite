import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectVisibleSortedDeviceAccounts } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import {
    selectPendingProposal,
    sessionProposalApproveThunk,
    sessionProposalRejectThunk,
} from '@suite-common/walletconnect';
import { AccountsListItem } from '@suite-native/accounts';
import {
    Badge,
    BottomSheet,
    Button,
    Card,
    HStack,
    InlineAlertBox,
    Text,
    TitleHeader,
    VStack,
} from '@suite-native/atoms';
import { NetworkIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ConnectAppIcon } from '../components/ConnectAppIcon';

const networkStyle = prepareNativeStyle<{ isDisabled: boolean }>((_, { isDisabled }) => ({
    opacity: 1,
    extend: {
        condition: isDisabled,
        style: {
            opacity: 0.5,
        },
    },
}));

export const WalletConnectSessionPopupScreen = () => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation();

    const dispatch = useDispatch();
    const pendingProposal = useSelector(selectPendingProposal);
    const accounts = useSelector(selectVisibleSortedDeviceAccounts);
    const selectableAccounts = useMemo<Account[]>(
        () =>
            pendingProposal?.networks
                .filter(network => network.status === 'active')
                .flatMap(network =>
                    accounts.filter(account => account.symbol === network.symbol),
                ) ?? [],
        [accounts, pendingProposal?.networks],
    );
    const [selectedDefaultAccount, setSelectedDefaultAccount] = useState<Account | null>(
        selectableAccounts[0] || null,
    );
    const [accountListOpen, setAccountListOpen] = useState(false);

    const handleAccept = () => {
        if (pendingProposal?.eventId) {
            dispatch(
                sessionProposalApproveThunk({
                    eventId: pendingProposal?.eventId,
                    selectedDefaultAccount,
                }),
            );
        }
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };
    const handleReject = () => {
        if (pendingProposal?.eventId) {
            dispatch(sessionProposalRejectThunk({ eventId: pendingProposal?.eventId }));
        }
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    const requiredNetworksNotActivated = pendingProposal?.networks.some(
        network => network.required && network.status !== 'active',
    );
    const noNetworksActivated = !pendingProposal?.networks.some(
        network => network.status === 'active',
    );
    const isDisabled = !pendingProposal || pendingProposal.expired || pendingProposal.isScam;

    return (
        <Screen header={<ScreenHeader closeActionType="close" />}>
            <VStack spacing="sp24">
                <TitleHeader
                    title={<Translation id="moduleConnectPopup.walletConnect.title" />}
                    subtitle={<Translation id="moduleConnectPopup.walletConnect.message" />}
                />

                <VStack>
                    <Text variant="highlight">
                        <Translation id="moduleConnectPopup.walletConnect.app" />
                    </Text>
                    <Card>
                        <HStack alignItems="center" spacing="sp16">
                            <ConnectAppIcon
                                src={pendingProposal?.params.proposer.metadata.icons[0]}
                                type="walletConnect"
                                size="large"
                            />
                            <VStack flex={1} spacing="sp4">
                                <HStack>
                                    <Text>{pendingProposal?.params.proposer.metadata.name}</Text>
                                    {!pendingProposal?.isScam &&
                                        pendingProposal?.validation === 'VALID' && (
                                            <Badge
                                                icon="check"
                                                variant="greenSubtle"
                                                label={
                                                    <Translation id="moduleConnectPopup.walletConnect.serviceStatus.verified" />
                                                }
                                            />
                                        )}
                                    {!pendingProposal?.isScam &&
                                        pendingProposal?.validation === 'UNKNOWN' && (
                                            <Badge
                                                icon="question"
                                                variant="neutral"
                                                label={
                                                    <Translation id="moduleConnectPopup.walletConnect.serviceStatus.unknown" />
                                                }
                                            />
                                        )}
                                    {(pendingProposal?.isScam ||
                                        pendingProposal?.validation === 'INVALID') && (
                                        <Badge
                                            icon="warning"
                                            variant="red"
                                            label={
                                                <Translation id="moduleConnectPopup.walletConnect.serviceStatus.dangerous" />
                                            }
                                        />
                                    )}
                                </HStack>
                                <Text color="textSubdued">
                                    {pendingProposal?.params.proposer.metadata.url}
                                </Text>
                            </VStack>
                        </HStack>
                    </Card>
                </VStack>

                <VStack>
                    <Text variant="highlight">
                        <Translation id="moduleConnectPopup.walletConnect.requestedNetworks" />
                    </Text>
                    <Card>
                        <HStack flexWrap="wrap" spacing="sp16">
                            {pendingProposal?.networks
                                .filter(network => network.status !== 'unsupported')
                                .map(network => (
                                    <HStack
                                        key={network.namespaceId}
                                        alignItems="center"
                                        spacing="sp8"
                                        style={applyStyle(networkStyle, {
                                            isDisabled: network.status !== 'active',
                                        })}
                                    >
                                        {network.symbol && (
                                            <NetworkIcon
                                                symbol={network.symbol as any}
                                                size="large"
                                            />
                                        )}
                                        <Text>
                                            {network.name}
                                            {network.required && (
                                                <Text color="textAlertRed">*</Text>
                                            )}
                                        </Text>
                                    </HStack>
                                ))}
                        </HStack>
                    </Card>
                </VStack>

                <VStack>
                    <Text variant="highlight">
                        <Translation id="moduleConnectPopup.walletConnect.selectedAccount" />
                    </Text>
                    <Card noPadding>
                        <AccountsListItem
                            account={selectedDefaultAccount || accounts[0]}
                            onPress={() => setAccountListOpen(true)}
                        />

                        <BottomSheet
                            isVisible={accountListOpen}
                            onClose={() => setAccountListOpen(false)}
                            title={
                                <Translation id="moduleConnectPopup.walletConnect.selectedAccount" />
                            }
                        >
                            {selectableAccounts.map(account => (
                                <AccountsListItem
                                    key={account.key}
                                    account={account}
                                    onPress={() => {
                                        setSelectedDefaultAccount(account);
                                        setAccountListOpen(false);
                                    }}
                                    hasBackground={selectedDefaultAccount?.key === account.key}
                                />
                            ))}
                        </BottomSheet>
                    </Card>
                </VStack>

                {(requiredNetworksNotActivated || noNetworksActivated) && (
                    <InlineAlertBox
                        variant="warning"
                        title={
                            <Translation
                                id={
                                    requiredNetworksNotActivated
                                        ? 'moduleConnectPopup.walletConnect.errors.requiredNetworksNotActivated'
                                        : 'moduleConnectPopup.walletConnect.errors.noNetworksActivated'
                                }
                            />
                        }
                    />
                )}

                {pendingProposal?.isScam && (
                    <InlineAlertBox
                        variant="critical"
                        title={<Translation id="moduleConnectPopup.walletConnect.errors.isScam" />}
                    />
                )}
                {pendingProposal?.validation === 'INVALID' && (
                    <InlineAlertBox
                        variant="critical"
                        title={
                            <Translation id="moduleConnectPopup.walletConnect.errors.unableToVerify" />
                        }
                    />
                )}

                {pendingProposal?.expired && (
                    <InlineAlertBox
                        variant="warning"
                        title={
                            <Translation id="moduleConnectPopup.walletConnect.errors.requestExpired" />
                        }
                    />
                )}

                <Button colorScheme="primary" onPress={handleAccept} isDisabled={isDisabled}>
                    <Translation id="generic.buttons.confirm" />
                </Button>

                <Button colorScheme="tertiaryElevation0" onPress={handleReject}>
                    <Translation id="generic.buttons.cancel" />
                </Button>
            </VStack>
        </Screen>
    );
};
