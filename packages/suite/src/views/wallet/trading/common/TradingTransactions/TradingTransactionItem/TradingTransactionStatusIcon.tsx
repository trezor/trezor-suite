import styled from 'styled-components';

import { useTranslation } from '@suite/intl';
import { IconCircle } from '@trezor/components';

import { type TradingTransactionStatusData } from './tradingTransactionItemUtils';

const Wrapper = styled.span`
    display: inline-flex;
`;

type TradingTransactionStatusIconProps = {
    status: TradingTransactionStatusData;
    'data-testid'?: string;
};

export const TradingTransactionStatusIcon = ({
    status,
    'data-testid': dataTestId,
}: TradingTransactionStatusIconProps) => {
    const { translationString } = useTranslation();
    const label = translationString(status.messageId);

    return (
        <Wrapper role="img" aria-label={label} title={label} data-testid={dataTestId}>
            <IconCircle icon={status.icon} intent={status.intent} size={24} />
        </Wrapper>
    );
};
