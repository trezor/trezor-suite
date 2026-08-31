import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { closeModal } from '@suite/modal';
import { goto } from '@suite/router';
import { TxSimulationBanner } from '@suite/tx-simulation/src/common';
import { useDappScan } from '@suite-common/tx-simulation';
import { networkSymbolCollection } from '@suite-common/wallet-config';
import { selectAllAccountsToList } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { sortByCoin } from '@suite-common/wallet-utils';
import {
    selectPendingProposal,
    sessionProposalApproveThunk,
    sessionProposalRejectThunk,
} from '@suite-common/walletconnect';
import { type PendingConnectionProposalNetwork } from '@suite-common/walletconnect/src/walletConnectTypes';
import {
    Badge,
    Banner,
    Card,
    Column,
    Modal,
    type Option,
    Row,
    Select,
    Text,
    Tooltip,
} from '@trezor/components';
import { ShieldCheckFilledIcon, ShieldWarningFilledIcon } from '@trezor/icons';
import { NetworkIcon } from '@trezor/product-components';

import { ConnectAppIcon } from 'src/components/suite/ConnectAppIcon';
import { useSelector } from 'src/hooks/suite';

import { WalletConnectAccountOption } from './WalletConnectAccountOption';

const NetworkItemWrapper = styled.div<{ $isDisabled: boolean }>`
    display: flex;
    flex-direction: row;
    gap: 8px;
    align-items: center;
    opacity: ${props => (props.$isDisabled ? 0.5 : 1)};
`;

// networks the dapp requests arrive in its own order, the modal follows the coin settings one
const getNetworkOrder = (symbol?: string) => {
    const index = networkSymbolCollection.findIndex(networkSymbol => networkSymbol === symbol);

    return index === -1 ? networkSymbolCollection.length : index;
};

interface WalletConnectProposalModalProps {
    eventId: number;
}

export const WalletConnectProposalModal = ({ eventId }: WalletConnectProposalModalProps) => {
    const dispatch = useDispatch();
    const pendingProposal = useSelector(selectPendingProposal);
    const accounts = useSelector(selectAllAccountsToList);
    const selectableAccounts = useMemo<Account[]>(
        () =>
            sortByCoin(
                pendingProposal?.networks
                    .filter(network => network.status === 'active')
                    .flatMap(network =>
                        accounts.filter(account => account.symbol === network.symbol),
                    ) ?? [],
            ),
        [accounts, pendingProposal?.networks],
    );
    const requestedNetworks = useMemo(
        () =>
            (pendingProposal?.networks ?? [])
                .filter(network => network.status !== 'unsupported')
                .toSorted((a, b) => getNetworkOrder(a.symbol) - getNetworkOrder(b.symbol)),
        [pendingProposal?.networks],
    );
    const [selectedDefaultAccount, setSelectedDefaultAccount] = useState<Account | null>(
        selectableAccounts[0] || null,
    );
    const [ignoreWarning, setIgnoreWarning] = useState(false);
    const dappScanQuery = useDappScan(pendingProposal?.params.proposer.metadata.url);

    const handleAccept = () => {
        dispatch(
            sessionProposalApproveThunk({
                eventId,
                selectedDefaultAccount,
            }),
        );
        dispatch(closeModal());
    };
    const handleReject = () => {
        dispatch(sessionProposalRejectThunk({ eventId }));
        dispatch(closeModal());
    };
    const handleGoToCoinSettings = async () => {
        await dispatch(closeModal());
        dispatch(goto({ routeName: 'settings-coins' }));
    };

    const getTooltipContent = (network: PendingConnectionProposalNetwork) => {
        if (network.status !== 'active')
            return (
                <Translation
                    id="TR_ACCOUNT_EXCEPTION_NOT_ENABLED"
                    values={{ networkName: network.name }}
                />
            );
        if (network.required) return <Translation id="TR_REQUIRED_FIELD" />;

        return undefined;
    };

    if (!pendingProposal) return null;

    const requiredNetworksNotActivated = pendingProposal.networks.some(
        network => network.required && network.status !== 'active',
    );
    const noNetworksActivated = !pendingProposal.networks.some(
        network => network.status === 'active',
    );

    return (
        <Modal
            onCancel={handleReject}
            bottomContent={
                <>
                    <Modal.Button
                        onClick={handleAccept}
                        isDisabled={
                            pendingProposal.expired ||
                            noNetworksActivated ||
                            ((pendingProposal.isScam || dappScanQuery.data?.isMalicious) &&
                                !ignoreWarning)
                        }
                        isLoading={dappScanQuery.isLoading}
                        data-testid="@walletconnect-proposal/confirm-button"
                    >
                        <Translation id="TR_CONFIRM" />
                    </Modal.Button>
                    <Modal.Button
                        intent="neutral"
                        priority="secondary"
                        onClick={handleReject}
                        data-testid="@walletconnect-proposal/cancel-button"
                    >
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
            heading={<Translation id="TR_WALLETCONNECT" />}
            description={<Translation id="TR_WALLETCONNECT_REQUEST" />}
        >
            <Column gap={8}>
                <Text>
                    <Translation id="TR_APP" />
                </Text>
                <Card>
                    <Row gap={16}>
                        <ConnectAppIcon
                            src={pendingProposal.params.proposer.metadata.icons?.[0]}
                            size={48}
                            type="walletConnect"
                        />

                        <Column gap={4}>
                            <Row gap={12}>
                                <Text>{pendingProposal.params.proposer.metadata.name}</Text>
                                <Text intent="neutral" priority="secondary">
                                    {pendingProposal.params.proposer.metadata.url}
                                </Text>
                            </Row>
                            <Row gap={12}>
                                {!pendingProposal.isScam &&
                                    pendingProposal.validation === 'VALID' && (
                                        <Badge intent="info" iconLeft={ShieldCheckFilledIcon}>
                                            <Translation id="TR_WALLETCONNECT_SERVICE_VERIFIED" />
                                        </Badge>
                                    )}
                                {!pendingProposal.isScam &&
                                    pendingProposal.validation === 'UNKNOWN' && (
                                        <Badge intent="warning" iconLeft={ShieldWarningFilledIcon}>
                                            <Translation id="TR_WALLETCONNECT_SERVICE_UNKNOWN" />
                                        </Badge>
                                    )}
                                {(pendingProposal.isScam ||
                                    pendingProposal.validation === 'INVALID') && (
                                    <Badge intent="critical" iconLeft={ShieldWarningFilledIcon}>
                                        <Translation id="TR_WALLETCONNECT_SERVICE_DANGEROUS" />
                                    </Badge>
                                )}
                            </Row>
                        </Column>
                    </Row>
                </Card>

                <Text>
                    <Translation id="TR_REQUESTED_NETWORKS" />
                </Text>
                <Card>
                    <Row rowGap={8} columnGap={12} flexWrap="wrap">
                        {requestedNetworks.map(network => (
                            <Tooltip content={getTooltipContent(network)} key={network.namespaceId}>
                                <NetworkItemWrapper $isDisabled={network.status !== 'active'}>
                                    {network.symbol && (
                                        <NetworkIcon
                                            networkSymbol={network.symbol as any}
                                            size={24}
                                        />
                                    )}
                                    <Text>
                                        {network.name}
                                        {network.required && <Text intent="critical">*</Text>}
                                    </Text>
                                </NetworkItemWrapper>
                            </Tooltip>
                        ))}
                    </Row>
                </Card>

                <Text>
                    <Translation id="TR_DEFAULT_ACCOUNT" />
                </Text>
                {selectableAccounts.length > 0 && (
                    <Select
                        isSearchable={false}
                        isClearable={false}
                        size="large"
                        isMenuFullWidth
                        value={selectedDefaultAccount}
                        options={selectableAccounts}
                        formatOptionLabel={(account: Account) => (
                            <WalletConnectAccountOption account={account} />
                        )}
                        onChange={(option: Option) => setSelectedDefaultAccount(option)}
                        closeMenuOnScroll={false}
                    />
                )}

                {(requiredNetworksNotActivated ||
                    noNetworksActivated ||
                    selectableAccounts.length === 0) && (
                    <Banner
                        intent="warning"
                        rightContent={
                            <Banner.Button onClick={() => handleGoToCoinSettings()}>
                                <Translation id="TR_COIN_SETTINGS" />
                            </Banner.Button>
                        }
                        description={
                            <Translation
                                id={
                                    requiredNetworksNotActivated
                                        ? 'TR_WALLETCONNECT_REQUIRED_NETWORKS_NOT_ACTIVATED'
                                        : 'TR_WALLETCONNECT_NO_NETWORKS_ACTIVATED'
                                }
                            />
                        }
                    />
                )}

                {(dappScanQuery.data?.isMalicious || pendingProposal.isScam) && (
                    <TxSimulationBanner
                        type="error"
                        title="TR_WALLETCONNECT_IS_SCAM"
                        description={<></>}
                        isAccepted={ignoreWarning}
                        onChange={setIgnoreWarning}
                    />
                )}
                {pendingProposal.validation === 'INVALID' && (
                    <Banner
                        intent="critical"
                        description={<Translation id="TR_WALLETCONNECT_UNABLE_TO_VERIFY" />}
                    />
                )}

                {pendingProposal.expired && (
                    <Banner
                        intent="warning"
                        description={<Translation id="TR_WALLETCONNECT_REQUEST_EXPIRED" />}
                    />
                )}
            </Column>
        </Modal>
    );
};
