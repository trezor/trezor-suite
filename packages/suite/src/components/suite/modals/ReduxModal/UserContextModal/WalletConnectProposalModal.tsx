import { useMemo, useState } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { onCancel } from '@suite/modal';
import { TxSimulationBanner } from '@suite/tx-simulation';
import { useDappScan } from '@suite-common/tx-simulation';
import { selectAllAccountsToList } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import {
    selectPendingProposal,
    sessionProposalApproveThunk,
    sessionProposalRejectThunk,
} from '@suite-common/walletconnect';
import { PendingConnectionProposalNetwork } from '@suite-common/walletconnect/src/walletConnectTypes';
import {
    Badge,
    Banner,
    Card,
    Column,
    ElevationUp,
    Modal,
    Option,
    Row,
    Select,
    Text,
    Tooltip,
} from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacings, spacingsPx } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { AccountLabel } from 'src/components/suite/AccountLabel';
import { ConnectAppIcon } from 'src/components/suite/ConnectAppIcon';
import { useDispatch, useSelector } from 'src/hooks/suite';

const NetworkItemWrapper = styled.div<{ $isDisabled: boolean }>`
    display: flex;
    flex-direction: row;
    gap: ${spacingsPx.xs};
    align-items: center;
    opacity: ${props => (props.$isDisabled ? 0.5 : 1)};
`;

interface WalletConnectProposalModalProps {
    eventId: number;
}

export const WalletConnectProposalModal = ({ eventId }: WalletConnectProposalModalProps) => {
    const dispatch = useDispatch();
    const pendingProposal = useSelector(selectPendingProposal);
    const accounts = useSelector(selectAllAccountsToList);
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
    const [ignoreWarning, setIgnoreWarning] = useState(false);
    const dappScanQuery = useDappScan(pendingProposal?.params.proposer.metadata.url);

    const handleAccept = () => {
        dispatch(
            sessionProposalApproveThunk({
                eventId,
                selectedDefaultAccount,
            }),
        );
        dispatch(onCancel());
    };
    const handleReject = () => {
        dispatch(sessionProposalRejectThunk({ eventId }));
        dispatch(onCancel());
    };
    const handleGoToCoinSettings = async () => {
        await dispatch(onCancel());
        dispatch(goto('settings-coins'));
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
            <Column gap={spacings.xs}>
                <Text>
                    <Translation id="TR_APP" />
                </Text>
                <Card>
                    <Row gap={spacings.md}>
                        <ConnectAppIcon
                            src={pendingProposal.params.proposer.metadata.icons?.[0]}
                            size={spacings.xxxxl}
                            type="walletConnect"
                        />

                        <Column gap={spacings.xxs}>
                            <Row gap={spacings.sm}>
                                <Text>{pendingProposal.params.proposer.metadata.name}</Text>
                                <Text intent="neutral" priority="secondary">
                                    {pendingProposal.params.proposer.metadata.url}
                                </Text>
                            </Row>
                            <Row gap={spacings.sm}>
                                {!pendingProposal.isScam &&
                                    pendingProposal.validation === 'VALID' && (
                                        <Badge intent="info" iconLeft="shieldCheckFilled">
                                            <Translation id="TR_WALLETCONNECT_SERVICE_VERIFIED" />
                                        </Badge>
                                    )}
                                {!pendingProposal.isScam &&
                                    pendingProposal.validation === 'UNKNOWN' && (
                                        <Badge intent="warning" iconLeft="shieldWarningFilled">
                                            <Translation id="TR_WALLETCONNECT_SERVICE_UNKNOWN" />
                                        </Badge>
                                    )}
                                {(pendingProposal.isScam ||
                                    pendingProposal.validation === 'INVALID') && (
                                    <Badge intent="critical" iconLeft="shieldWarningFilled">
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
                    <Row rowGap={spacings.xs} columnGap={spacings.sm} flexWrap="wrap">
                        {pendingProposal.networks
                            .filter(network => network.status !== 'unsupported')
                            .map(network => (
                                <Tooltip
                                    content={getTooltipContent(network)}
                                    key={network.namespaceId}
                                >
                                    <NetworkItemWrapper $isDisabled={network.status !== 'active'}>
                                        {network.symbol && (
                                            <CoinLogo
                                                type="network"
                                                symbol={network.symbol as any}
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
                    <Card paddingType="none">
                        {/* Wrapped to keep consistent styling */}
                        <ElevationUp>
                            <Select
                                isSearchable={false}
                                isClearable={false}
                                size="large"
                                value={selectedDefaultAccount}
                                options={selectableAccounts}
                                formatOptionLabel={(account: Account) => (
                                    <Row gap={spacings.xs}>
                                        {account.symbol && (
                                            <CoinLogo
                                                type="token"
                                                symbol={account.symbol}
                                                size={24}
                                            />
                                        )}
                                        <AccountLabel
                                            account={account}
                                            key={account.descriptor}
                                            showAccountTypeBadge
                                            accountTypeBadgeSize="small"
                                        />
                                    </Row>
                                )}
                                onChange={(option: Option) => setSelectedDefaultAccount(option)}
                                closeMenuOnScroll={false}
                            />
                        </ElevationUp>
                    </Card>
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
                        disclaimerAccepted={ignoreWarning}
                        setDisclaimerAccepted={setIgnoreWarning}
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
