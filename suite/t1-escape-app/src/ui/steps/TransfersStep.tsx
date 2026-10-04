import { Banner, Button, Card, Column, H2, Paragraph, Row } from '@trezor/components';

import { type Transfer, isTransferUnsettled } from '../../app/migrationState';
import type { Destination } from '../../bitcoin/destinationAddress';
import {
    type FirmwareVersion,
    isAffectedBySegwitAmountVulnerability,
} from '../../firmware/firmwareSupport';
import { BulletList } from '../BulletList';
import { TransferCard } from '../TransferCard';

type TransfersStepProps = {
    transfers: readonly Transfer[];
    destination: Destination;
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
    hasUnsignedPlans: boolean;
};

const getFinishLabel = ({ isDeviceReleased, hasUnsignedPlans }: GetFinishLabelParams) => {
    if (isDeviceReleased) return 'Show the summary';

    return hasUnsignedPlans
        ? 'Stop here and lock the Trezor'
        : 'Lock the Trezor and show the summary';
};

export const TransfersStep = ({
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
}: TransfersStepProps) => {
    const isAnythingSigned = transfers.some(({ stage }) => stage !== 'ready');
    const hasUnsignedPlans = transfers.some(({ stage, plan }) => stage === 'ready' && plan);
    const hasUnsentTransactions = transfers.some(
        ({ stage }) => stage === 'signed' || stage === 'broadcasting',
    );
    const hasPendingTransfers = transfers.some(isTransferUnsettled);

    return (
        <Column gap={16}>
            <Card>
                <Column gap={12} alignItems="flex-start">
                    <H2>Transfers</H2>
                    <Paragraph>
                        Everything goes to <strong>{destination.address}</strong>. Each account type
                        needs its own transaction. The Trezor shows the address and the amount of
                        each one: confirm only if both match this page and your new wallet.
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

            {isAffectedBySegwitAmountVulnerability(firmwareVersion) && (
                <Banner
                    intent="critical"
                    title="Never confirm the same address with the same amount twice"
                    description={
                        <BulletList>
                            <BulletList.Item>
                                Before you confirm on the Trezor, write the amount it shows down on
                                paper.
                            </BulletList.Item>
                            <BulletList.Item>
                                If the Trezor ever shows an address together with an amount that is
                                already on your paper, reject it on the Trezor and close this page.
                            </BulletList.Item>
                            <BulletList.Item>
                                This tool gives every transfer a different amount, also when one has
                                to be repeated. A repeated amount means something is wrong.
                            </BulletList.Item>
                        </BulletList>
                    }
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
                <Banner intent="info" description="No account has bitcoin that can be moved." />
            )}

            {transfers.map(transfer => (
                <TransferCard
                    key={transfer.key}
                    transfer={transfer}
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
                            priority={hasUnsignedPlans ? 'secondary' : 'primary'}
                            onClick={onFinish}
                        >
                            {getFinishLabel({ isDeviceReleased, hasUnsignedPlans })}
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
