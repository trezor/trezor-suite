import {
    selectPendingProposal,
    sessionProposalApproveThunk,
    sessionProposalRejectThunk,
} from '@suite-common/walletconnect';
import { Banner, Card, H2, NewModal, Note, Paragraph, Row, Text } from '@trezor/components';
import { BannerButton } from '@trezor/components/src/components/Banner/BannerButton';
import { CoinLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { onCancel } from 'src/actions/suite/modalActions';
import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

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

    if (!pendingProposal) return null;

    return (
        <NewModal
            onCancel={handleReject}
            iconName="plugs"
            variant="primary"
            bottomContent={
                <>
                    <NewModal.Button variant="tertiary" onClick={handleReject}>
                        <Translation id="TR_CANCEL" />
                    </NewModal.Button>
                    <NewModal.Button
                        variant="primary"
                        onClick={handleAccept}
                        isDisabled={pendingProposal.expired || pendingProposal.isScam}
                    >
                        <Translation id="TR_CONFIRM" />
                    </NewModal.Button>
                </>
            }
            heading={<Translation id="TR_TREZOR_CONNECT" />}
        >
            <H2>{pendingProposal.params.proposer.metadata.name}</H2>

            <Paragraph>{pendingProposal.params.proposer.metadata.url}</Paragraph>

            {!pendingProposal.isScam && pendingProposal.validation === 'VALID' && (
                <Note variant="info" iconName="shieldCheckFilled">
                    <Translation id="TR_WALLETCONNECT_SERVICE_VERIFIED" />
                </Note>
            )}
            {!pendingProposal.isScam && pendingProposal.validation === 'UNKNOWN' && (
                <Note variant="warning" iconName="shieldWarningFilled">
                    <Translation id="TR_WALLETCONNECT_SERVICE_UNKNOWN" />
                </Note>
            )}
            {(pendingProposal.isScam || pendingProposal.validation === 'INVALID') && (
                <Note variant="destructive" iconName="shieldWarningFilled">
                    <Translation id="TR_WALLETCONNECT_SERVICE_DANGEROUS" />
                </Note>
            )}

            <Paragraph variant="tertiary" margin={{ top: spacings.xs }}>
                <Translation id="TR_WALLETCONNECT_REQUEST" />
            </Paragraph>

            <Card margin={{ top: spacings.xs }} paddingType="small">
                {['active', 'inactive', 'unsupported'].map(status => {
                    const filteredNetworks = pendingProposal.networks.filter(
                        network => network.status == status,
                    );
                    if (!filteredNetworks?.length) return null;

                    return (
                        <>
                            <Text variant="tertiary">{`Requested networks - ${status}: `}</Text>
                            <Row
                                key={status}
                                rowGap={spacings.xs}
                                columnGap={spacings.sm}
                                flexWrap="wrap"
                                margin={{ bottom: spacings.sm }}
                            >
                                {filteredNetworks.map(network => (
                                    <Row key={network.namespaceId} gap={spacings.xs}>
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
                                    </Row>
                                ))}
                            </Row>
                        </>
                    );
                })}
            </Card>
            {pendingProposal.networks.some(
                network => network.required && network.status !== 'active',
            ) && (
                <Banner
                    variant="warning"
                    margin={{ top: spacings.xs }}
                    rightContent={
                        <BannerButton
                            onClick={() => dispatch(goto('settings-coins'))}
                            icon="arrowRight"
                            iconAlignment="end"
                        >
                            Coin settings
                        </BannerButton>
                    }
                >
                    Some required networks are not activated. Please activate them to ensure proper
                    compatibility with the app.
                </Banner>
            )}

            {pendingProposal.isScam && (
                <Banner variant="destructive" margin={{ top: spacings.xs }}>
                    <Translation id="TR_WALLETCONNECT_IS_SCAM" />
                </Banner>
            )}
            {pendingProposal.validation === 'INVALID' && (
                <Banner variant="destructive" margin={{ top: spacings.xs }}>
                    <Translation id="TR_WALLETCONNECT_UNABLE_TO_VERIFY" />
                </Banner>
            )}

            {pendingProposal.expired && (
                <Banner variant="warning" margin={{ top: spacings.xs }}>
                    <Translation id="TR_WALLETCONNECT_REQUEST_EXPIRED" />
                </Banner>
            )}
        </NewModal>
    );
};
