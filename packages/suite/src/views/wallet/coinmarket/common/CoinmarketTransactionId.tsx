import styled from 'styled-components';
import { variables, Button } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { useDispatch } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { notificationsActions } from '@suite-common/toast-notifications';
import { typography } from '@trezor/theme';

const Wrapper = styled.div`
    display: flex;
    margin-top: 10px;
    padding: 0 10px;
    align-items: center;
    justify-content: space-between;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Left = styled.div`
    display: flex;
`;

const Right = styled.div``;

const Label = styled.div`
    text-transform: capitalize;
    ${typography.label}
    padding-right: 3px;
    white-space: nowrap;
`;

const Value = styled.div`
    max-width: 220px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

interface CoinmarketTransactionIdTransactionIdProps {
    transactionId: string;
    className?: string;
}

export const CoinmarketTransactionId = ({
    transactionId,
    className,
}: CoinmarketTransactionIdTransactionIdProps) => {
    const dispatch = useDispatch();
    const copy = () => {
        const result = copyToClipboard(transactionId);
        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };

    return (
        <Wrapper className={className}>
            <Left>
                <Label>
                    <Translation id="TR_BUY_TRANS_ID" />
                </Label>
                <Value>{transactionId}</Value>
            </Left>
            <Right>
                <Button variant="tertiary" onClick={copy}>
                    <Translation id="TR_COPY_TO_CLIPBOARD_TX_ID" />
                </Button>
            </Right>
        </Wrapper>
    );
};
