import { Banner, Button, Card, Column, H2, Paragraph, Row, Table } from '@trezor/components';

import { ACCOUNT_TYPE_DEFINITIONS, formatPath } from '../../bitcoin/accountType';
import type { DiscoveryError, ScannedAccount } from '../../discovery/discoverAccounts';
import { type ScanReport } from '../../discovery/scanReport';
import { ScanScope } from '../ScanScope';
import { formatBitcoin } from '../formatAmount';
import { describeDiscoveryError, isWrongPinError } from '../messages';

type DiscoveryStepProps = {
    accounts: readonly ScannedAccount[];
    report?: ScanReport;
    error?: DiscoveryError;
    isBusy: boolean;
    isDeviceUsable: boolean;
    onStart: () => void;
    onScanMore: () => void;
    onContinue: () => void;
};

export const DiscoveryStep = ({
    accounts,
    report,
    error,
    isBusy,
    isDeviceUsable,
    onStart,
    onScanMore,
    onContinue,
}: DiscoveryStepProps) => {
    const hasFunds = accounts.some(({ snapshot }) => snapshot.utxos.length > 0);
    const hasStarted = accounts.length > 0 || isBusy || error !== undefined;

    return (
        <Card>
            <Column gap={16} alignItems="flex-start">
                <H2>Finding your bitcoin</H2>
                {!hasStarted && (
                    <Paragraph>
                        The Trezor will be asked for the public keys of its Bitcoin accounts. It may
                        ask for your PIN.
                    </Paragraph>
                )}
                {accounts.length > 0 && (
                    <Table>
                        <Table.Header>
                            <Table.Row>
                                <Table.Cell>Account</Table.Cell>
                                <Table.Cell>Path</Table.Cell>
                                <Table.Cell align="end">Balance</Table.Cell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {accounts.map(({ account, snapshot, isEmpty }) => (
                                <Table.Row key={`${account.accountType}-${account.accountIndex}`}>
                                    <Table.Cell>
                                        {ACCOUNT_TYPE_DEFINITIONS[account.accountType].label} #
                                        {account.accountIndex + 1}
                                    </Table.Cell>
                                    <Table.Cell>{formatPath(account.path)}</Table.Cell>
                                    <Table.Cell align="end">
                                        {isEmpty
                                            ? 'never used'
                                            : formatBitcoin(snapshot.info.balance)}
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                )}
                {error && (
                    <Banner
                        intent="critical"
                        description={
                            isWrongPinError(error)
                                ? `${describeDiscoveryError(error)} The PIN is not tried again automatically. Make sure you know it before you try again.`
                                : describeDiscoveryError(error)
                        }
                    />
                )}
                {report && !isBusy && !error && (
                    <>
                        {!hasFunds && (
                            <Banner
                                intent="info"
                                description="No bitcoin was found in the scanned accounts. If you expected some, it may be behind a different passphrase or in an account further down."
                            />
                        )}
                        <ScanScope report={report} />
                    </>
                )}
                <Row gap={8}>
                    {(!report || error) && (
                        <Button isLoading={isBusy} isDisabled={!isDeviceUsable} onClick={onStart}>
                            {error ? 'Try again' : 'Search'}
                        </Button>
                    )}
                    {report && !error && (
                        <>
                            <Button isDisabled={isBusy || !hasFunds} onClick={onContinue}>
                                Continue
                            </Button>
                            <Button
                                priority="secondary"
                                isLoading={isBusy}
                                isDisabled={!isDeviceUsable}
                                onClick={onScanMore}
                            >
                                Scan more accounts
                            </Button>
                        </>
                    )}
                </Row>
            </Column>
        </Card>
    );
};
