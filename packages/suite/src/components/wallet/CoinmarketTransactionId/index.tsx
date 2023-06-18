import React from 'react';
import styled from 'styled-components';
import { variables, Button } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { useActions } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { notificationsActions } from '@suite-common/toast-notifications';

interface Props {
    transactionId: string;
    className?: string;
}

const Wrapper = styled.div`
    display: flex;
    margin-top: 10px;
    padding: 0 10px;
    align-items: center;
    justify-content: space-between;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Left = styled.div`
    display: flex;
`;

const Right = styled.div``;

const Label = styled.div`
    text-transform: uppercase;
    font-size: ${variables.FONT_SIZE.TINY};
    padding-right: 3px;
    white-space: nowrap;
`;

const Value = styled.div`
    max-width: 220px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const TransactionId = ({ transactionId, className }: Props) => {
    const { addNotification } = useActions({ addNotification: notificationsActions.addToast });
    const copy = () => {
        const result = copyToClipboard(transactionId);
        if (typeof result !== 'string') {
            addNotification({ type: 'copy-to-clipboard' });
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
                <Button variant="tertiary" onClick={() => copy()}>
                    <Translation id="TR_COPY_TO_CLIPBOARD_TX_ID" />
                </Button>
            </Right>
        </Wrapper>
    );
};

export default TransactionId;
