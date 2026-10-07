import { Banner, Button, Card, Column, H2, Paragraph, Row } from '@trezor/components';

import { type EthereumTransfer, isEthereumTransferUnsettled } from '../../app/migrationState';
import { ETHEREUM_CHAIN_DEFINITIONS, type EthereumChain } from '../../ethereum/ethereumChain';
import type { EthereumDestination } from '../../ethereum/ethereumDestination';
import { type FirmwareVersion, showsEthereumAddressChecksum } from '../../firmware/firmwareSupport';
import { EthereumTransferCard } from '../EthereumTransferCard';

type EthereumTransfersStepProps = {
    chain: EthereumChain;
    transfers: readonly EthereumTransfer[];
    destination: EthereumDestination;
    firmwareVersion: FirmwareVersion;
    isBusy: boolean;
    isDeviceUsable: boolean;
    isDeviceReleased: boolean;
    onSign: (key: string) => void;
    onBroadcast: (key: string) => void;
    onRetry: (key: string) => void;
    onRefresh: () => void;
    onEditDestination: () => void;
    onFinish: () => void;
};

type GetFinishLabelParams = {
    isDeviceReleased: boolean;
    hasTransfersToSign: boolean;
};

const getFinishLabel = ({ isDeviceReleased, hasTransfersToSign }: GetFinishLabelParams) => {
    if (isDeviceReleased) return 'Show the summary';

    return hasTransfersToSign
        ? 'Stop here and lock the Trezor'
        : 'Lock the Trezor and show the summary';
};

export const EthereumTransfersStep = ({
    chain,
    transfers,
    destination,
    firmwareVersion,
    isBusy,
    isDeviceUsable,
    isDeviceReleased,
    onSign,
    onBroadcast,
    onRetry,
    onRefresh,
    onEditDestination,
    onFinish,
}: EthereumTransfersStepProps) => {
    const { symbol } = ETHEREUM_CHAIN_DEFINITIONS[chain];
    const isAnythingSigned = transfers.some(({ stage }) => stage !== 'ready');
    const hasTransfersToSign = transfers.some(
        ({ stage, plan, isInFlight }) => (stage === 'ready' && plan) || isInFlight,
    );
    const hasUnsentTransactions = transfers.some(
        ({ stage }) => stage === 'signed' || stage === 'broadcasting',
    );
    const hasPendingTransfers = transfers.some(isEthereumTransferUnsettled);

    return (
        <Column gap={16}>
            <Card>
                <Column gap={12} alignItems="flex-start">
                    <H2>Transfers</H2>
                    <Paragraph>
                        Everything goes to <strong>{destination.address}</strong>. Each address
                        needs its own transaction. The Trezor shows the address and the amount, then
                        the maximum fee: confirm only if the address and the amount match this page
                        and your new wallet.
                    </Paragraph>
                    {!isAnythingSigned && (
                        <Button
                            size="small"
                            priority="secondary"
                            isDisabled={isBusy}
                            onClick={onEditDestination}
                        >
                            Change the address
                        </Button>
                    )}
                </Column>
            </Card>

            {!showsEthereumAddressChecksum(firmwareVersion) && (
                <Banner
                    intent="warning"
                    title="The Trezor shows the address in lowercase"
                    description="This firmware shows the destination without the 0x prefix and without the capital letters of the checksum. Compare the characters and ignore their case."
                />
            )}

            {hasPendingTransfers && (
                <Banner
                    intent="warning"
                    title="Do not update or wipe the old Trezor yet"
                    description="At least one transfer is not confirmed. Until it is, the old Trezor is the only thing that can move these coins again if the transfer does not go through."
                />
            )}

            {transfers.length === 0 && (
                <Banner intent="info" description={`No address has ${symbol} that can be moved.`} />
            )}

            {transfers.map(transfer => (
                <EthereumTransferCard
                    key={transfer.key}
                    transfer={transfer}
                    symbol={symbol}
                    isBusy={isBusy}
                    isDeviceUsable={isDeviceUsable}
                    onSign={onSign}
                    onBroadcast={onBroadcast}
                    onRetry={onRetry}
                />
            ))}

            <Card>
                <Column gap={12} alignItems="flex-start">
                    {hasUnsentTransactions && (
                        <Banner
                            intent="warning"
                            description="A signed transaction has not been sent yet. Send it or copy it before you leave this page."
                        />
                    )}
                    <Row gap={8}>
                        <Button
                            isDisabled={isBusy || (isDeviceReleased && hasUnsentTransactions)}
                            priority={hasTransfersToSign ? 'secondary' : 'primary'}
                            onClick={onFinish}
                        >
                            {getFinishLabel({ isDeviceReleased, hasTransfersToSign })}
                        </Button>
                        {hasPendingTransfers && (
                            <Button priority="secondary" onClick={onRefresh}>
                                Check confirmations now
                            </Button>
                        )}
                    </Row>
                </Column>
            </Card>
        </Column>
    );
};
