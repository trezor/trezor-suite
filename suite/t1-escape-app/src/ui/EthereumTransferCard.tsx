import { Banner, Button, Card, Column, H3, Paragraph, Row, Text } from '@trezor/components';

import { SignedTransactionPanel } from './SignedTransactionPanel';
import { describeEthereumSweepStatus, describeEthereumTransferError } from './ethereumMessages';
import { formatEthereumAmount, formatGasPrice } from './formatEthereumAmount';
import type { EthereumTransfer } from '../app/migrationState';
import { formatPath } from '../bitcoin/accountType';
import {
    ETHEREUM_CHAIN_DEFINITIONS,
    ETHEREUM_TRANSACTION_DECODER_URL,
    type EthereumChain,
    getEthereumSendTransactionUrl,
    getEthereumTransactionUrl,
} from '../ethereum/ethereumChain';
import type { EthereumSweepStatus } from '../migration/ethereumSweepStatus';

type EthereumTransferCardProps = {
    transfer: EthereumTransfer;
    symbol: string;
    isBusy: boolean;
    isDeviceUsable: boolean;
    onSign: (key: string) => void;
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

type GetDecoderComparisonParams = {
    chain: EthereumChain;
    fromAddress: string;
};

// The decoder recovers the sender and reads the chain id from the signature, so both can be
// checked besides what the Trezor showed.
const getDecoderComparison = ({ chain, fromAddress }: GetDecoderComparisonParams) => {
    const { chainId, label } = ETHEREUM_CHAIN_DEFINITIONS[chain];

    return `Compare the destination address and the amount with the ones shown above, and check that the "from" address is ${fromAddress} (your old address) and that the chain id is ${chainId} (${label}).`;
};

export const EthereumTransferCard = ({
    transfer,
    symbol,
    isBusy,
    isDeviceUsable,
    onSign,
    onRetry,
}: EthereumTransferCardProps) => {
    const { key, account, plan, leftover, record, stage, status, error, isInFlight } = transfer;
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

                {record && (
                    <SignedTransactionPanel
                        hex={record.hex}
                        txid={record.txid}
                        isOnNetwork={stage === 'on-network'}
                        links={{
                            decoder: ETHEREUM_TRANSACTION_DECODER_URL,
                            sendTransaction: getEthereumSendTransactionUrl(account.chain),
                            transaction: getEthereumTransactionUrl(account.chain, record.txid),
                        }}
                        decoderComparison={getDecoderComparison({
                            chain: account.chain,
                            fromAddress: account.address,
                        })}
                    />
                )}

                {stage === 'on-network' && status && (
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
