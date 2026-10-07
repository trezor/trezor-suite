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

import { describeEthereumSweepStatus, describeEthereumTransferError } from './ethereumMessages';
import { formatEthereumAmount, formatGasPrice } from './formatEthereumAmount';
import type { EthereumTransfer } from '../app/migrationState';
import { formatPath } from '../bitcoin/accountType';
import type { EthereumSweepStatus } from '../migration/ethereumSweepStatus';

type EthereumTransferCardProps = {
    transfer: EthereumTransfer;
    symbol: string;
    isBusy: boolean;
    isDeviceUsable: boolean;
    onSign: (key: string) => void;
    onBroadcast: (key: string) => void;
    onRetry: (key: string) => void;
};

const getStatusIntent = (status: EthereumSweepStatus) => {
    switch (status) {
        case 'confirmed':
            return 'brand' as const;
        case 'pending':
        case 'unknown':
            return 'info' as const;
        case 'not-in-mempool':
            return 'warning' as const;
        case 'failed':
            return 'critical' as const;
        // no default
    }
};

const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
};

export const EthereumTransferCard = ({
    transfer,
    symbol,
    isBusy,
    isDeviceUsable,
    onSign,
    onBroadcast,
    onRetry,
}: EthereumTransferCardProps) => {
    const { key, account, plan, leftover, record, stage, status, error, isInFlight } = transfer;
    const isSigned = record !== undefined;
    const canBroadcastAgain = stage === 'broadcast' && status === 'not-in-mempool';
    const canRetry =
        !plan &&
        !isInFlight &&
        stage === 'ready' &&
        (error !== undefined || leftover !== undefined);

    return (
        <Card>
            <Column gap={12} alignItems="flex-start">
                <H3>{account.address}</H3>
                <Text priority="secondary">{formatPath(account.path)}</Text>

                {plan && (
                    <Column gap={4}>
                        <Paragraph>
                            Amount the Trezor will show:{' '}
                            <strong>{formatEthereumAmount(plan.amount, symbol)}</strong>
                        </Paragraph>
                        <Paragraph>
                            Maximum fee: {formatEthereumAmount(plan.fee, symbol)} ({plan.gasLimit}{' '}
                            gas at {formatGasPrice(plan.gasPrice)})
                        </Paragraph>
                        <Paragraph>To: {plan.destination.address}</Paragraph>
                    </Column>
                )}

                {isInFlight && (
                    <Banner
                        intent="info"
                        description="A transaction of this address is still waiting for confirmation. The transfer is prepared once it settles; this page checks every half minute."
                    />
                )}

                {leftover && (
                    <Paragraph>
                        Staying on the old device: {formatEthereumAmount(leftover.balance, symbol)}{' '}
                        does not cover the fee of {formatEthereumAmount(leftover.fee, symbol)} for
                        moving it.
                    </Paragraph>
                )}

                {!plan && !leftover && !isInFlight && !error && (
                    <Paragraph>Nothing on this address can be moved right now.</Paragraph>
                )}

                {error && (
                    <Banner intent="critical" description={describeEthereumTransferError(error)} />
                )}

                {isSigned && (
                    <Column gap={8} width="100%">
                        <Paragraph>
                            Signed transaction. Keep a copy: it is lost when this page is closed,
                            and this tool will not sign this address a second time.
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
                        description={describeEthereumSweepStatus(status)}
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
                    {canRetry && (
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
