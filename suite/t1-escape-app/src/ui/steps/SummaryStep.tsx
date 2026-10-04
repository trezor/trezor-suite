import { Banner, Button, Card, Column, H2, H4, Paragraph } from '@trezor/components';

import { type Transfer, isTransferUnsettled } from '../../app/migrationState';
import { ACCOUNT_TYPE_DEFINITIONS } from '../../bitcoin/accountType';
import type { ScanReport } from '../../discovery/scanReport';
import { BulletList } from '../BulletList';
import { ScanScope } from '../ScanScope';
import { formatBitcoin, sumSatoshi } from '../formatAmount';
import { describeSweepStatus } from '../messages';

type SummaryStepProps = {
    isDeviceLocked: boolean;
    transfers: readonly Transfer[];
    report?: ScanReport;
    onRefresh: () => void;
};

const getAccountLabel = ({ account }: Transfer) =>
    `${ACCOUNT_TYPE_DEFINITIONS[account.accountType].label} account #${account.accountIndex + 1}`;

export const SummaryStep = ({ isDeviceLocked, transfers, report, onRefresh }: SummaryStepProps) => {
    const sent = transfers.filter(({ stage }) => stage === 'broadcast');
    const notSent = transfers.filter(({ stage, plan }) => stage !== 'broadcast' && plan);
    const leftoverAmounts = transfers.flatMap(({ leftovers }) =>
        leftovers.map(({ utxo }) => utxo.amount),
    );
    const hasPending = transfers.some(isTransferUnsettled);
    // The headline claims a confirmed transfer only when that is true for every transfer
    // that was prepared. Coins that were deliberately left behind are listed right below it.
    const isEverythingConfirmed = sent.length > 0 && notSent.length === 0 && !hasPending;

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
                                        {getAccountLabel(transfer)}:{' '}
                                        {transfer.plan && formatBitcoin(transfer.plan.amount)}
                                        {' – '}
                                        {describeSweepStatus(transfer.status ?? 'unknown')}
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

                    {(notSent.length > 0 || leftoverAmounts.length > 0) && (
                        <Column gap={8}>
                            <H4>Still on the old device from the scanned accounts</H4>
                            <BulletList>
                                {notSent.map(transfer => (
                                    <BulletList.Item key={transfer.key}>
                                        {getAccountLabel(transfer)}: transfer was not sent
                                    </BulletList.Item>
                                ))}
                                {leftoverAmounts.length > 0 && (
                                    <BulletList.Item>
                                        {formatBitcoin(sumSatoshi(leftoverAmounts))} in{' '}
                                        {leftoverAmounts.length} small or unconfirmed{' '}
                                        {leftoverAmounts.length === 1 ? 'coin' : 'coins'}
                                    </BulletList.Item>
                                )}
                            </BulletList>
                        </Column>
                    )}
                </Column>
            </Card>

            {report && (
                <Card>
                    <ScanScope report={report} />
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
