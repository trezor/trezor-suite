import styled from 'styled-components';
import { useSelector } from 'src/hooks/suite';
import { Modal, Translation } from 'src/components/suite';
import { ClaimModalContent } from './ClaimModalContent';

const StyledModal = styled(Modal)`
    width: 512px;
    text-align: left;
`;

interface ClaimModalModalProps {
    onCancel?: () => void;
}

export const ClaimModal = ({ onCancel }: ClaimModalModalProps) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    const { account, status } = selectedAccount;
    // it shouldn't be possible to open this modal without having selected account
    if (!account || status !== 'loaded') return null;

    return (
        <StyledModal
            isCancelable
            heading={<Translation id="TR_STAKE_CLAIM" />}
            subheading={
                <Translation
                    id="TR_STAKE_CLAIMED_AMOUNT_TRANSFERRED"
                    values={{ symbol: account.symbol.toUpperCase() }}
                />
            }
            onCancel={onCancel}
        >
            <ClaimModalContent selectedAccount={selectedAccount} />
        </StyledModal>
    );
};
