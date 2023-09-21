import { Button, H3 } from '@trezor/components';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import { Translation, Modal } from 'src/components/suite';
import styled from 'styled-components';
import { setShowLeaveModal } from 'src/actions/wallet/coinmarketSellActions';

const Text = styled(H3)`
    display: flex;
    width: 100%;
    padding: 10px 0;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

export type CoinmarketLeaveSpendModalProps = {
    onCancel: () => void;
};

export const CoinmarketLeaveSpendModal = ({ onCancel }: CoinmarketLeaveSpendModalProps) => {
    const dispatch = useDispatch();

    const leave = () => {
        onCancel();
        dispatch(setShowLeaveModal(false));
    };
    const stay = () => {
        onCancel();
        dispatch(goto('wallet-coinmarket-spend'));
    };

    return (
        <Modal
            isCancelable
            onCancel={onCancel}
            bottomBarComponents={
                <>
                    <Button onClick={leave}>
                        <Translation id="TR_SPEND_LEAVE" />
                    </Button>
                    <Button onClick={stay}>
                        <Translation id="TR_SPEND_STAY" />
                    </Button>
                </>
            }
        >
            <Text>
                <Translation id="TR_SPEND_LEAVE_MODAL_INFO" />
            </Text>
        </Modal>
    );
};
