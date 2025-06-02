import { useMemo, useState } from 'react';

import styled from 'styled-components';

import { selectVisibleSortedDeviceAccounts } from '@suite-common/wallet-core';
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
    IconCircle,
    Modal,
    Option,
    Row,
    Select,
    Text,
    Tooltip,
} from '@trezor/components';
import { BannerButton } from '@trezor/components/src/components/Banner/BannerButton';
import { CoinLogo } from '@trezor/product-components';
import { spacings, spacingsPx } from '@trezor/theme';

import { onCancel } from 'src/actions/suite/modalActions';
import { goto } from 'src/actions/suite/routerActions';
import { AccountLabel, Translation } from 'src/components/suite';
import { AccountTypeBadge } from 'src/components/suite/AccountTypeBadge';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectAccountLabels } from 'src/reducers/suite/metadataReducer';

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
    const accounts = useSelector(selectVisibleSortedDeviceAccounts);
    const accountLabels = useSelector(selectAccountLabels);
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
                        variant="primary"
                        onClick={handleAccept}
                        isDisabled={
                            pendingProposal.expired || pendingProposal.isScam || noNetworksActivated
                        }
                    >
                        <Translation id="TR_CONFIRM" />
                    </Modal.Button>
                    <Modal.Button variant="tertiary" onClick={handleReject}>
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
                        <IconCircle
                            name="walletConnect"
                            size={spacings.xxxxl}
                            paddingType="large"
                            variant="tertiary"
                            hasBorder={false}
                        />

                        <Column gap={spacings.xxs}>
                            <Row gap={spacings.sm}>
                                <Text>{pendingProposal.params.proposer.metadata.name}</Text>
                                <Text variant="tertiary">
                                    {pendingProposal.params.proposer.metadata.url}
                                </Text>
                            </Row>
                            <Row gap={spacings.sm}>
                                {!pendingProposal.isScam &&
                                    pendingProposal.validation === 'VALID' && (
                                        <Badge variant="info" icon="shieldCheckFilled">
                                            <Translation id="TR_WALLETCONNECT_SERVICE_VERIFIED" />
                                        </Badge>
                                    )}
                                {!pendingProposal.isScam &&
                                    pendingProposal.validation === 'UNKNOWN' && (
                                        <Badge variant="warning" icon="shieldWarningFilled">
                                            <Translation id="TR_WALLETCONNECT_SERVICE_UNKNOWN" />
                                        </Badge>
                                    )}
                                {(pendingProposal.isScam ||
                                    pendingProposal.validation === 'INVALID') && (
                                    <Badge variant="destructive" icon="shieldWarningFilled">
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
                                            {network.required && (
                                                <Text variant="destructive">*</Text>
                                            )}
                                        </Text>
                                    </NetworkItemWrapper>
                                </Tooltip>
                            ))}
                    </Row>
                </Card>

                <Text>
                    <Translation id="TR_DEFAULT_ACCOUNT" />
                </Text>
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
                                        <CoinLogo type="token" symbol={account.symbol} size={24} />
                                    )}
                                    <AccountLabel
                                        key={account.descriptor}
                                        accountLabel={accountLabels[account.key]}
                                        accountType={account.accountType}
                                        networkType={account.networkType}
                                        symbol={account.symbol}
                                        index={account.index}
                                        path={account.path}
                                    />
                                    <AccountTypeBadge
                                        accountType={account.accountType}
                                        networkType={account.networkType}
                                        size="small"
                                        onElevation
                                    />
                                </Row>
                            )}
                            onChange={(option: Option) => setSelectedDefaultAccount(option)}
                        />
                    </ElevationUp>
                </Card>

                {(requiredNetworksNotActivated || noNetworksActivated) && (
                    <Banner
                        variant="warning"
                        rightContent={
                            <BannerButton
                                onClick={() => handleGoToCoinSettings()}
                                icon="arrowRight"
                                iconAlignment="end"
                            >
                                <Translation id="TR_COIN_SETTINGS" />
                            </BannerButton>
                        }
                    >
                        <Translation
                            id={
                                requiredNetworksNotActivated
                                    ? 'TR_WALLETCONNECT_REQUIRED_NETWORKS_NOT_ACTIVATED'
                                    : 'TR_WALLETCONNECT_NO_NETWORKS_ACTIVATED'
                            }
                        />
                    </Banner>
                )}

                {pendingProposal.isScam && (
                    <Banner variant="destructive">
                        <Translation id="TR_WALLETCONNECT_IS_SCAM" />
                    </Banner>
                )}
                {pendingProposal.validation === 'INVALID' && (
                    <Banner variant="destructive">
                        <Translation id="TR_WALLETCONNECT_UNABLE_TO_VERIFY" />
                    </Banner>
                )}

                {pendingProposal.expired && (
                    <Banner variant="warning">
                        <Translation id="TR_WALLETCONNECT_REQUEST_EXPIRED" />
                    </Banner>
                )}
            </Column>
        </Modal>
    );
};
