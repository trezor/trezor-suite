import { useEffect, useMemo, useState } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { closeModal, preserveModal, removePreserveModal } from '@suite/modal';
import { TxSimulationBanner } from '@suite/tx-simulation/src/common';
import { selectSupportedNetworkSymbols } from '@suite-common/networks';
import { useDappScan } from '@suite-common/tx-simulation';
import { selectAllAccountsToList } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { sortByCoin } from '@suite-common/wallet-utils';
import {
    selectPendingProposal,
    selectPendingProposalNetworks,
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
import { useServices } from '@trezor/dependency-injection';
import { ShieldCheckFilledIcon, ShieldWarningFilledIcon } from '@trezor/icons';
import { NetworkIcon } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

import { ConnectAppIcon } from '#src/components/suite/ConnectAppIcon';
import { useSelector } from '#src/hooks/suite';
import { selectDiscoveryOverallStatus } from '#src/utils/wallet/selectDiscoveryOverallStatus';

import { ActivateAssetsModal } from './ActivateAssetsModal';
import { WalletConnectAccountOption } from './WalletConnectAccountOption';

const NetworkItemWrapper = styled.div<{ $isDisabled: boolean }>`
    display: flex;
    flex-direction: row;
    gap: 8px;
    align-items: center;
    opacity: ${props => (props.$isDisabled ? 0.5 : 1)};
`;

// networks the dapp requests arrive in its own order, the modal follows the coin settings one
const getNetworkOrder = (supportedNetworks: readonly string[], symbol?: string) => {
    const index = supportedNetworks.findIndex(networkSymbol => networkSymbol === symbol);

    return index === -1 ? supportedNetworks.length : index;
};

interface WalletConnectProposalModalProps {
    eventId: number;
}

export const WalletConnectProposalModal = ({ eventId }: WalletConnectProposalModalProps) => {
    const { dispatch } = useServices(injectDispatch);
    const supportedNetworks = useSelector(selectSupportedNetworkSymbols);
    const pendingProposal = useSelector(selectPendingProposal);
    const proposalNetworks = useSelector(selectPendingProposalNetworks);
    const accounts = useSelector(selectAllAccountsToList);
    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
    const selectableAccounts = useMemo<Account[]>(
        () =>
            sortByCoin(
                proposalNetworks
                    .filter(network => network.status === 'active')
                    .flatMap(network =>
                        accounts.filter(account => account.symbol === network.symbol),
                    ),
                supportedNetworks,
            ),
        [accounts, proposalNetworks, supportedNetworks],
    );
    const requestedNetworks = useMemo(
        () =>
            proposalNetworks
                .filter(network => network.status !== 'unsupported')
                .toSorted(
                    (a, b) =>
                        getNetworkOrder(supportedNetworks, a.symbol) -
                        getNetworkOrder(supportedNetworks, b.symbol),
                ),
        [proposalNetworks, supportedNetworks],
    );
    const [selectedDefaultAccount, setSelectedDefaultAccount] = useState<Account | null>(null);
    const [ignoreWarning, setIgnoreWarning] = useState(false);
    const [isActivatingAssets, setIsActivatingAssets] = useState(false);
    // Scan where the proposal came from, not the url the proposer declared for itself.
    const dappScanQuery = useDappScan(pendingProposal?.origin);

    // Device calls of a running discovery close unpreserved modals, which would leave the proposal
    // unanswered. The activate assets modal preserves itself while it is open.
    useEffect(() => {
        if (isActivatingAssets) return undefined;

        dispatch(preserveModal());

        return () => {
            dispatch(removePreserveModal());
        };
    }, [dispatch, isActivatingAssets]);

    // Accounts of enabled networks may still be on the way, so their networks are not inactive yet.
    const isDiscoveryLoading = discoveryStatus?.status === 'loading';
    // The proposal can open before any account is discovered, so the default follows the
    // discovered accounts until the user picks one.
    const defaultAccount = selectedDefaultAccount ?? selectableAccounts[0] ?? null;

    const handleAccept = () => {
        dispatch(
            sessionProposalApproveThunk({
                eventId,
                selectedDefaultAccount: defaultAccount,
            }),
        );
        dispatch(closeModal());
    };
    const handleReject = () => {
        dispatch(sessionProposalRejectThunk({ eventId }));
        dispatch(closeModal());
    };

    const isShownAsInactive = (network: PendingConnectionProposalNetwork) =>
        network.status !== 'active' && !isDiscoveryLoading;

    const getTooltipContent = (network: PendingConnectionProposalNetwork) => {
        if (isShownAsInactive(network))
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

    if (isActivatingAssets) {
        return <ActivateAssetsModal onCancel={() => setIsActivatingAssets(false)} />;
    }

    const requiredNetworksNotActivated = proposalNetworks.some(
        network => network.required && network.status !== 'active',
    );
    const noNetworksActivated = !proposalNetworks.some(network => network.status === 'active');
    const isActivateAssetsBannerVisible =
        !isDiscoveryLoading &&
        (requiredNetworksNotActivated || noNetworksActivated || selectableAccounts.length === 0);

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
                        isLoading={dappScanQuery.isLoading || isDiscoveryLoading}
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
                                <NetworkItemWrapper $isDisabled={isShownAsInactive(network)}>
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
                        value={defaultAccount}
                        options={selectableAccounts}
                        formatOptionLabel={(account: Account) => (
                            <WalletConnectAccountOption account={account} />
                        )}
                        onChange={(option: Option) => setSelectedDefaultAccount(option)}
                        closeMenuOnScroll={false}
                    />
                )}

                {isActivateAssetsBannerVisible && (
                    <Banner
                        intent="warning"
                        rightContent={
                            <Banner.Button onClick={() => setIsActivatingAssets(true)}>
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
