import {
    Banner,
    Button,
    Card,
    Column,
    H3,
    Paragraph,
    Row,
    Text,
    Textarea,
} from '@trezor/components';

import { BulletList } from './BulletList';
import { formatBitcoin, sumSatoshi } from './formatAmount';
import { describeLeftover, describeSweepStatus, describeTransferError } from './messages';
import type { Transfer } from '../app/migrationState';
import { ACCOUNT_TYPE_DEFINITIONS, formatPath } from '../bitcoin/accountType';
import type { LeftoverReason } from '../bitcoin/composeSweep';
import type { SweepStatus } from '../migration/sweepStatus';

type TransferCardProps = {
    transfer: Transfer;
    isBusy: boolean;
    isDeviceUsable: boolean;
    onSign: (key: string) => void;
    onBroadcast: (key: string) => void;
    onRetry: (key: string) => void;
};

const LEFTOVER_REASONS: LeftoverReason[] = [
    'unconfirmed',
    'immature-coinbase',
    'uneconomic',
    'insufficient-for-fee',
];

const getStatusIntent = (status: SweepStatus) => {
    switch (status) {
        case 'confirmed':
            return 'brand' as const;
        case 'pending':
        case 'unknown':
            return 'info' as const;
        case 'not-in-mempool':
        case 'spent-by-another-transaction':
            return 'warning' as const;
        // no default
    }
};

const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
};

export const TransferCard = ({
    transfer,
    isBusy,
    isDeviceUsable,
    onSign,
    onBroadcast,
    onRetry,
}: TransferCardProps) => {
    const { key, account, plan, record, stage, status, error, leftovers } = transfer;
    const isSigned = record !== undefined;
    const canBroadcastAgain = stage === 'broadcast' && status === 'not-in-mempool';

    return (
        <Card>
            <Column gap={12} alignItems="flex-start">
                <H3>
                    {ACCOUNT_TYPE_DEFINITIONS[account.accountType].label} account #
                    {account.accountIndex + 1}
                </H3>
                <Text priority="secondary">{formatPath(account.path)}</Text>

                {plan && (
                    <Column gap={4}>
                        <Paragraph>
                            Amount the Trezor will show:{' '}
                            <strong>{formatBitcoin(plan.amount)}</strong>
                        </Paragraph>
                        <Paragraph>
                            Fee: {formatBitcoin(plan.fee)} ({plan.inputs.length}{' '}
                            {plan.inputs.length === 1 ? 'coin' : 'coins'} spent)
                        </Paragraph>
                        <Paragraph>To: {plan.destination.address}</Paragraph>
                    </Column>
                )}

                {!plan && !error && (
                    <Paragraph>Nothing in this account can be moved right now.</Paragraph>
                )}

                {transfer.inFlightTransactions > 0 && (
                    <Banner
                        intent="info"
                        description="A transaction spending coins of this account is already waiting for confirmation. Its coins are not included here."
                    />
                )}

                {transfer.followingTransactions > 0 && (
                    <Paragraph priority="secondary">
                        This account has more coins than fit into one transaction.{' '}
                        {transfer.followingTransactions} more{' '}
                        {transfer.followingTransactions === 1
                            ? 'transfer follows'
                            : 'transfers follow'}{' '}
                        after this one is sent.
                    </Paragraph>
                )}

                {leftovers.length > 0 && (
                    <Column gap={4}>
                        <Paragraph>Staying on the old device:</Paragraph>
                        <BulletList>
                            {LEFTOVER_REASONS.flatMap(reason => {
                                const amounts = leftovers
                                    .filter(leftover => leftover.reason === reason)
                                    .map(({ utxo }) => utxo.amount);

                                return amounts.length === 0
                                    ? []
                                    : [
                                          <BulletList.Item key={reason}>
                                              {formatBitcoin(sumSatoshi(amounts))} in{' '}
                                              {amounts.length}{' '}
                                              {amounts.length === 1 ? 'coin' : 'coins'}:{' '}
                                              {describeLeftover(reason)}
                                          </BulletList.Item>,
                                      ];
                            })}
                        </BulletList>
                    </Column>
                )}

                {error && <Banner intent="critical" description={describeTransferError(error)} />}

                {isSigned && (
                    <Column gap={8} width="100%">
                        <Paragraph>
                            Signed transaction. Keep a copy: it is lost when this page is closed,
                            and this tool will not sign these coins a second time.
                        </Paragraph>
                        <Textarea
                            label="Signed transaction (hex)"
                            value={record.hex}
                            readOnly
                            rows={4}
                        />
                        <Row>
                            <Button
                                size="small"
                                priority="secondary"
                                onClick={() => copyToClipboard(record.hex)}
                            >
                                Copy
                            </Button>
                        </Row>
                    </Column>
                )}

                {stage === 'broadcast' && status && (
                    <Banner
                        intent={getStatusIntent(status)}
                        description={describeSweepStatus(status)}
                    />
                )}

                <Row gap={8}>
                    {plan && stage === 'ready' && (
                        <Button isDisabled={isBusy || !isDeviceUsable} onClick={() => onSign(key)}>
                            Sign on Trezor
                        </Button>
                    )}
                    {stage === 'signing' && <Button isLoading>Signing</Button>}
                    {(stage === 'signed' || stage === 'broadcasting') && (
                        <Button
                            isLoading={stage === 'broadcasting'}
                            onClick={() => onBroadcast(key)}
                        >
                            Send transaction
                        </Button>
                    )}
                    {canBroadcastAgain && (
                        <Button isDisabled={isBusy} onClick={() => onBroadcast(key)}>
                            Send the same transaction again
                        </Button>
                    )}
                    {!plan && error && stage === 'ready' && (
                        <Button
                            priority="secondary"
                            isDisabled={isBusy}
                            onClick={() => onRetry(key)}
                        >
                            Try again
                        </Button>
                    )}
                </Row>
            </Column>
        </Card>
    );
};
