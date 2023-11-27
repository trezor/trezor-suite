import styled from 'styled-components';
import { Modal, Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { StakeModalContent } from './StakeModalContent';

const StyledModal = styled(Modal)`
    // TODO: Make the modal wider when the right section with the graph and staking info is implemented.
    width: 400px;
    text-align: left;
`;

interface StakeModalModalProps {
    onCancel?: () => void;
}

export const StakeModal = ({ onCancel }: StakeModalModalProps) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    const { account, status } = selectedAccount;
    // it shouldn't be possible to open this modal without having selected account
    if (!account || status !== 'loaded') return null;

    return (
        <StyledModal isCancelable heading={<Translation id="TR_STAKE_ETH" />} onCancel={onCancel}>
            <StakeModalContent selectedAccount={selectedAccount} />
        </StyledModal>
    );
};
