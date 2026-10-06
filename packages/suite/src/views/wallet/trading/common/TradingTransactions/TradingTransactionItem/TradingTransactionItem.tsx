import { Card, Icon, Row, Text } from '@trezor/components';
import { ArrowRightIcon } from '@trezor/icons';

import { FormattedDate } from 'src/components/suite';

import { TradingTransactionSideAmount } from './TradingTransactionSideAmount';
import { TradingTransactionStatusIcon } from './TradingTransactionStatusIcon';
import {
    type TradingTransactionSide,
    type TradingTransactionStatusData,
} from './tradingTransactionItemUtils';

const dateFormat = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
} as const;

type TradingTransactionItemProps = {
    from: TradingTransactionSide;
    to: TradingTransactionSide;
    date: string;
    status?: TradingTransactionStatusData;
    onClick: () => void;
    'data-testid'?: string;
};

export const TradingTransactionItem = ({
    from,
    to,
    date,
    status,
    onClick,
    'data-testid': dataTestId,
}: TradingTransactionItemProps) => (
    <Card onClick={onClick} paddingType="none" data-testid={dataTestId}>
        <Row padding={16} gap={8} justifyContent="space-between">
            <Row gap={8} flexWrap="wrap">
                <TradingTransactionSideAmount
                    side={from}
                    data-testid="@trading/transactions/send/amount"
                />
                <Icon as={ArrowRightIcon} size={16} intent="neutral" priority="secondary" />
                <TradingTransactionSideAmount
                    side={to}
                    data-testid="@trading/transactions/receive/amount"
                />
            </Row>
            <Row gap={8}>
                <Text
                    typographyStyle="body-sm"
                    intent="neutral"
                    priority="secondary"
                    data-testid="@trading/transactions/date"
                >
                    <FormattedDate value={date} {...dateFormat} />
                </Text>
                {status && (
                    <TradingTransactionStatusIcon
                        status={status}
                        data-testid="@trading/transactions/status"
                    />
                )}
            </Row>
        </Row>
    </Card>
);
