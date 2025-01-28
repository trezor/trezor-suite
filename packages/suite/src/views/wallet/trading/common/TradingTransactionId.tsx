import styled from 'styled-components';

import { notificationsActions } from '@suite-common/toast-notifications';
import { Button, Row } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { spacings, spacingsPx, typography } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

const LabelWrapper = styled.div`
    width: 100%;
    flex: auto;
    padding-right: ${spacingsPx.sm};
    ${typography.label}
    color: ${({ theme }) => theme.textSubdued};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const ButtonWrapper = styled.div`
    flex: none;
`;

interface TradingTransactionIdProps {
    transactionId: string;
}

export const TradingTransactionId = ({ transactionId }: TradingTransactionIdProps) => {
    const dispatch = useDispatch();
    const copy = () => {
        const result = copyToClipboard(transactionId);
        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };

    return (
        <Row alignItems="center" justifyContent="space-between" margin={{ top: spacings.sm }}>
            <LabelWrapper>
                <Translation id="TR_TRADING_TRANS_ID" /> {transactionId}
            </LabelWrapper>
            <ButtonWrapper>
                <Button size="tiny" variant="tertiary" onClick={copy}>
                    <Translation id="TR_COPY_TO_CLIPBOARD" />
                </Button>
            </ButtonWrapper>
        </Row>
    );
};
