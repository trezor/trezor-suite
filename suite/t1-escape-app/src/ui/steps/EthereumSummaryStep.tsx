import { Banner, Button, Card, Column, H2, H4, Paragraph } from '@trezor/components';

import { summarizeEthereumTransfers } from '../../app/ethereumTransferSummary';
import type { EthereumTransfer } from '../../app/migrationState';
import type { EthereumScannedAddress } from '../../discovery/discoverEthereumAddresses';
import type { EthereumScanReport } from '../../discovery/ethereumScanReport';
import { BulletList } from '../BulletList';
import { EthereumScanScope } from '../EthereumScanScope';
import { describeEthereumSweepStatus } from '../ethereumMessages';
import { formatEthereumAmount, formatTokenAmount, sumWei } from '../formatEthereumAmount';

type EthereumSummaryStepProps = {
    isDeviceLocked: boolean;
    symbol: string;
    transfers: readonly EthereumTransfer[];
    addresses: readonly EthereumScannedAddress[];
    report?: EthereumScanReport;
    onRefresh: () => void;
};

const describeNotSent = ({ plan, isInFlight }: EthereumTransfer) => {
    if (plan) return 'transfer was not sent';
    if (isInFlight) return 'a transaction was still pending, its coins were not moved';

    return 'could not be checked, its coins were not moved';
};

export const EthereumSummaryStep = ({
    isDeviceLocked,
    symbol,
    transfers,
    addresses,
    report,
    onRefresh,
}: EthereumSummaryStepProps) => {
    const { sent, notSent, leftoverAmounts, tokens, hasPending, isEverythingConfirmed } =
        summarizeEthereumTransfers({ transfers, addresses });

    const getHeadline = () => {
        if (isEverythingConfirmed) return 'Confirmed transfer of the funds found in this scope';
        if (hasPending) return 'The transfers are not confirmed yet';

        return 'Not everything that was found has been transferred';
    };

    return (
        <Column gap={16}>
            <Card>
                <Column gap={16} alignItems="flex-start">
                    <H2>{getHeadline()}</H2>
                    <Paragraph>
                        {isDeviceLocked
                            ? 'The Trezor is locked. You can unplug it now.'
                            : 'The Trezor could not be locked from here. Unplug it now.'}
                    </Paragraph>

                    {hasPending && (
                        <Banner
                            intent="warning"
                            title="Do not update or wipe the old Trezor yet"
                            description="Keep this page open until every transfer below is confirmed. If one does not go through, only the old Trezor can move those coins again."
                        />
                    )}

                    {sent.length > 0 && (
                        <Column gap={8}>
                            <H4>Transfers</H4>
                            <BulletList>
                                {sent.map(transfer => (
                                    <BulletList.Item key={transfer.key}>
                                        {transfer.account.address}:{' '}
                                        {transfer.plan &&
                                            formatEthereumAmount(transfer.plan.amount, symbol)}
                                        {' – '}
                                        {describeEthereumSweepStatus(transfer.status ?? 'unknown')}
                                    </BulletList.Item>
                                ))}
                            </BulletList>
                        </Column>
                    )}

                    {hasPending && (
                        <Button priority="secondary" onClick={onRefresh}>
                            Check confirmations now
                        </Button>
                    )}

                    {(notSent.length > 0 || leftoverAmounts.length > 0 || tokens.length > 0) && (
                        <Column gap={8}>
                            <H4>Still on the old device from the scanned addresses</H4>
                            <BulletList>
                                {notSent.map(transfer => (
                                    <BulletList.Item key={transfer.key}>
                                        {transfer.account.address}: {describeNotSent(transfer)}
                                    </BulletList.Item>
                                ))}
                                {leftoverAmounts.length > 0 && (
                                    <BulletList.Item>
                                        {formatEthereumAmount(sumWei(leftoverAmounts), symbol)} on{' '}
                                        {leftoverAmounts.length}{' '}
                                        {leftoverAmounts.length === 1 ? 'address' : 'addresses'} too
                                        small to pay for a transaction
                                    </BulletList.Item>
                                )}
                                {tokens.map(token => (
                                    <BulletList.Item key={`${token.contract}`}>
                                        {formatTokenAmount(token)} (ERC-20, not moved by this tool)
                                    </BulletList.Item>
                                ))}
                            </BulletList>
                        </Column>
                    )}
                </Column>
            </Card>

            {report && (
                <Card>
                    <EthereumScanScope report={report} />
                </Card>
            )}

            <Banner
                intent="info"
                title="About updating the old Trezor"
                description="This tool looked only at the scope listed above and cannot tell you that the device holds nothing else. Updating a device that runs firmware 1.6.1 erases it, and so does a firmware update that gets interrupted."
            />
        </Column>
    );
};
