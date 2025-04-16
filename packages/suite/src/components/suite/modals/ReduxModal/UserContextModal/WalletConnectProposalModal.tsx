import styled from 'styled-components';

import {
    selectPendingProposal,
    sessionProposalApproveThunk,
    sessionProposalRejectThunk,
} from '@suite-common/walletconnect';
import { PendingConnectionProposalNetwork } from '@suite-common/walletconnect/src/walletConnectTypes';
import {
    Banner,
    Card,
    Column,
    IconCircle,
    NewModal,
    Note,
    Row,
    Text,
    Tooltip,
} from '@trezor/components';
import { BannerButton } from '@trezor/components/src/components/Banner/BannerButton';
import { CoinLogo } from '@trezor/product-components';
import { spacings, spacingsPx } from '@trezor/theme';

import { onCancel } from 'src/actions/suite/modalActions';
import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
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

    const handleAccept = () => {
        dispatch(sessionProposalApproveThunk({ eventId }));
        dispatch(onCancel());
    };
    const handleReject = () => {
        dispatch(sessionProposalRejectThunk({ eventId }));
        dispatch(onCancel());
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

    return (
        <NewModal
            onCancel={handleReject}
            bottomContent={
                <>
                    <NewModal.Button
                        variant="primary"
                        onClick={handleAccept}
                        isDisabled={pendingProposal.expired || pendingProposal.isScam}
                    >
                        <Translation id="TR_CONFIRM" />
                    </NewModal.Button>
                    <NewModal.Button variant="tertiary" onClick={handleReject}>
                        <Translation id="TR_CANCEL" />
                    </NewModal.Button>
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
                                        <Note variant="info" iconName="shieldCheckFilled">
                                            <Translation id="TR_WALLETCONNECT_SERVICE_VERIFIED" />
                                        </Note>
                                    )}
                                {!pendingProposal.isScam &&
                                    pendingProposal.validation === 'UNKNOWN' && (
                                        <Note variant="warning" iconName="shieldWarningFilled">
                                            <Translation id="TR_WALLETCONNECT_SERVICE_UNKNOWN" />
                                        </Note>
                                    )}
                                {(pendingProposal.isScam ||
                                    pendingProposal.validation === 'INVALID') && (
                                    <Note variant="destructive" iconName="shieldWarningFilled">
                                        <Translation id="TR_WALLETCONNECT_SERVICE_DANGEROUS" />
                                    </Note>
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

                {pendingProposal.networks.some(
                    network => network.required && network.status !== 'active',
                ) && (
                    <Banner
                        variant="warning"
                        rightContent={
                            <BannerButton
                                onClick={() => dispatch(goto('settings-coins'))}
                                icon="arrowRight"
                                iconAlignment="end"
                            >
                                <Translation id="TR_COIN_SETTINGS" />
                            </BannerButton>
                        }
                    >
                        <Translation id="TR_WALLETCONNECT_REQUIRED_NETWORKS_NOT_ACTIVATED" />
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
        </NewModal>
    );
};
