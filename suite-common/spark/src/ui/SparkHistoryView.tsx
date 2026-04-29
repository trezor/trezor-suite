import { Button, Card, Column, Row, Text } from '@trezor/components';

type SparkTransferView = {
    amountSats: string;
    counterparty: string;
    createdAt: string;
    direction: 'send' | 'receive';
    id: string;
    rail: 'bitcoin' | 'lightning';
    status: 'completed';
    summary: string;
};

type SparkHistoryViewProps = {
    accountNumber: number;
    balanceSats: string | null;
    onOpenReceive: () => void;
    onOpenSend: () => void;
    transfers: SparkTransferView[];
};

export const SparkHistoryView = ({
    accountNumber,
    balanceSats,
    onOpenReceive,
    onOpenSend,
    transfers,
}: SparkHistoryViewProps) => (
    <Column gap={16}>
        <Card>
            <Column gap={16}>
                <Text typographyStyle="headline-sm">Spark account #{accountNumber + 1}</Text>
                <Row justifyContent="space-between" alignItems="center">
                    <Column gap={4}>
                        <Text typographyStyle="body-xs" color="contentSecondary">
                            BALANCE
                        </Text>
                        <Text typographyStyle="headline-sm">{balanceSats ?? '0'} sats</Text>
                    </Column>
                    <Row gap={8}>
                        <Button intent="neutral" priority="secondary" onClick={onOpenReceive}>
                            Receive
                        </Button>
                        <Button onClick={onOpenSend}>Send over Lightning</Button>
                    </Row>
                </Row>
            </Column>
        </Card>

        <Card>
            <Column gap={16}>
                <Text typographyStyle="body-md-strong">Recent activity</Text>
                {transfers.length === 0 ? (
                    <Text color="contentSecondary">
                        No Spark transfers yet. Send over Lightning or fund the wallet manually.
                    </Text>
                ) : (
                    <Column gap={12}>
                        {transfers.map(transfer => (
                            <Row key={transfer.id} justifyContent="space-between" gap={16}>
                                <Column gap={2}>
                                    <Text>
                                        {transfer.direction === 'send' ? 'Sent' : 'Received'} via{' '}
                                        {transfer.rail}
                                    </Text>
                                    <Text color="contentSecondary">{transfer.summary}</Text>
                                    <Text color="contentSecondary">{transfer.counterparty}</Text>
                                </Column>
                                <Column gap={2} alignItems="flex-end">
                                    <Text>
                                        {transfer.direction === 'send' ? '-' : '+'}
                                        {transfer.amountSats} sats
                                    </Text>
                                    <Text color="contentSecondary">{transfer.status}</Text>
                                    <Text color="contentSecondary">
                                        {new Date(transfer.createdAt).toLocaleString()}
                                    </Text>
                                </Column>
                            </Row>
                        ))}
                    </Column>
                )}
            </Column>
        </Card>
    </Column>
);
