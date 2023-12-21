import styled from 'styled-components';
import { useSelector } from 'src/hooks/suite';
import { Modal, Translation } from 'src/components/suite';
import { UnstakeModalContent } from './UnstakeModalContent';

const StyledModal = styled(Modal)`
    width: 512px;
    text-align: left;
`;

interface UnstakeModalModalProps {
    onCancel?: () => void;
}

export const UnstakeModal = ({ onCancel }: UnstakeModalModalProps) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    const { account, status } = selectedAccount;
    // it shouldn't be possible to open this modal without having selected account
    if (!account || status !== 'loaded') return null;

    return (
        <StyledModal
            isCancelable
            heading={<Translation id="TR_STAKE_UNSTAKE" />}
            subheading={<Translation id="TR_STAKE_CLAIM_AFTER_UNSTAKING" />}
            onCancel={onCancel}
        >
            <UnstakeModalContent selectedAccount={selectedAccount} />
        </StyledModal>
    );
};
