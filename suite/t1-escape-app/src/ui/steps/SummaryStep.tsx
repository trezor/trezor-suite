import { Banner, Button, Card, Column, H2, H3, H4, Paragraph } from '@trezor/components';

import {
    type EthereumTransferSummary,
    summarizeEthereumTransfers,
} from '../../app/ethereumTransferSummary';
import type { EthereumChainState, EthereumTransfer, Transfer } from '../../app/migrationState';
import {
    type MigrationOutcome,
    type TransferSummary,
    getMigrationOutcome,
    summarizeTransfers,
} from '../../app/transferSummary';
import { ACCOUNT_TYPE_DEFINITIONS } from '../../bitcoin/accountType';
import type { WalletScanReport } from '../../discovery/walletScanReport';
import {
    ETHEREUM_CHAINS,
    ETHEREUM_CHAIN_DEFINITIONS,
    type EthereumChain,
} from '../../ethereum/ethereumChain';
import { BulletList } from '../BulletList';
import { ScanScope } from '../ScanScope';
import { describeEthereumSweepStatus } from '../ethereumMessages';
import { formatBitcoin, sumSatoshi } from '../formatAmount';
import { formatEthereumAmount, formatTokenAmount, sumWei } from '../formatEthereumAmount';
import { describeSweepStatus } from '../messages';

type SummaryStepProps = {
    isDeviceLocked: boolean;
    bitcoinTransfers: readonly Transfer[];
    ethereum: Record<EthereumChain, Pick<EthereumChainState, 'transfers' | 'addresses'>>;
    report?: WalletScanReport;
    onRefresh: () => void;
};

const HEADLINES: Record<MigrationOutcome, string> = {
    confirmed: 'Confirmed transfer of the funds found in this scope',
    pending: 'The transfers are not confirmed yet',
    incomplete: 'Not everything that was found has been transferred',
};

const getAccountLabel = ({ account }: Transfer) =>
    `${ACCOUNT_TYPE_DEFINITIONS[account.accountType].label} account #${account.accountIndex + 1}`;

const describeEthereumNotSent = ({ plan, isInFlight }: EthereumTransfer) => {
    if (plan) return 'transfer was not sent';
    if (isInFlight) return 'a transaction was still pending, its coins were not moved';

    return 'could not be checked, its coins were not moved';
};

type BitcoinSummaryProps = {
    summary: TransferSummary;
};

const BitcoinSummary = ({ summary }: BitcoinSummaryProps) => {
    const { sent, notSent, leftoverAmounts } = summary;

    return (
        <Column gap={12}>
            <H3>Bitcoin</H3>
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
            {(notSent.length > 0 || leftoverAmounts.length > 0) && (
                <Column gap={8}>
                    <H4>Still on the old device from the scanned accounts</H4>
                    <BulletList>
                        {notSent.map(transfer => (
                            <BulletList.Item key={transfer.key}>
                                {getAccountLabel(transfer)}:{' '}
                                {transfer.plan
                                    ? 'transfer was not sent'
                                    : 'could not be checked, its coins were not moved'}
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
    );
};

type EthereumChainSummaryProps = {
    chain: EthereumChain;
    summary: EthereumTransferSummary;
};

const EthereumChainSummary = ({ chain, summary }: EthereumChainSummaryProps) => {
    const { label, symbol } = ETHEREUM_CHAIN_DEFINITIONS[chain];
    const { sent, notSent, leftoverAmounts, tokens } = summary;

    return (
        <Column gap={12}>
            <H3>{label}</H3>
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
            {(notSent.length > 0 || leftoverAmounts.length > 0 || tokens.length > 0) && (
                <Column gap={8}>
                    <H4>Still on the old device from the scanned addresses</H4>
                    <BulletList>
                        {notSent.map(transfer => (
                            <BulletList.Item key={transfer.key}>
                                {transfer.account.address}: {describeEthereumNotSent(transfer)}
                            </BulletList.Item>
                        ))}
                        {leftoverAmounts.length > 0 && (
                            <BulletList.Item>
                                {formatEthereumAmount(sumWei(leftoverAmounts), symbol)} on{' '}
                                {leftoverAmounts.length}{' '}
                                {leftoverAmounts.length === 1 ? 'address' : 'addresses'} too small
                                to pay for a transaction
                            </BulletList.Item>
                        )}
                        {tokens.map(token => (
                            <BulletList.Item key={token.contract}>
                                {formatTokenAmount(token)} (ERC-20, not moved by this tool)
                            </BulletList.Item>
                        ))}
                    </BulletList>
                </Column>
            )}
        </Column>
    );
};

export const SummaryStep = ({
    isDeviceLocked,
    bitcoinTransfers,
    ethereum,
    report,
    onRefresh,
}: SummaryStepProps) => {
    const bitcoinSummary = summarizeTransfers(bitcoinTransfers);
    const ethereumSummaries = ETHEREUM_CHAINS.map(chain => ({
        chain,
        hasTransfers: ethereum[chain].transfers.length > 0,
        summary: summarizeEthereumTransfers(ethereum[chain]),
    }));

    // Only the coins that had something to move count towards the verdict. A chain whose
    // addresses only carry tokens is still listed, so that the tokens are not forgotten.
    const outcome = getMigrationOutcome([
        ...(bitcoinTransfers.length > 0 ? [bitcoinSummary] : []),
        ...ethereumSummaries
            .filter(({ hasTransfers }) => hasTransfers)
            .map(({ summary }) => summary),
    ]);
    const hasPending = outcome === 'pending';

    return (
        <Column gap={16}>
            <Card>
                <Column gap={16} alignItems="flex-start">
                    <H2>{HEADLINES[outcome]}</H2>
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

                    {bitcoinTransfers.length > 0 && <BitcoinSummary summary={bitcoinSummary} />}

                    {ethereumSummaries
                        .filter(
                            ({ hasTransfers, summary }) =>
                                hasTransfers || summary.tokens.length > 0,
                        )
                        .map(({ chain, summary }) => (
                            <EthereumChainSummary key={chain} chain={chain} summary={summary} />
                        ))}

                    {hasPending && (
                        <Button priority="secondary" onClick={onRefresh}>
                            Check confirmations now
                        </Button>
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
