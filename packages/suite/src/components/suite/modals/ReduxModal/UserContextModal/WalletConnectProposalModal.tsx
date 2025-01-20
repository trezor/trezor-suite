import {
    selectPendingProposal,
    sessionProposalApproveThunk,
    sessionProposalRejectThunk,
} from '@suite-common/walletconnect';
import { Banner, H2, NewModal, Note, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { onCancel } from 'src/actions/suite/modalActions';
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
