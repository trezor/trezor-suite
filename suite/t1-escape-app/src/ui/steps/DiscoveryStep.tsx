import { Banner, Button, Card, Column, H2, H4, Paragraph, Row, Table } from '@trezor/components';

import {
    type EthereumChainState,
    hasBitcoinToMove,
    hasEthereumToMove,
} from '../../app/migrationState';
import { ACCOUNT_TYPE_DEFINITIONS, formatPath } from '../../bitcoin/accountType';
import type { DiscoveryError, ScannedAccount } from '../../discovery/discoverAccounts';
import type {
    EthereumDiscoveryError,
    EthereumScannedAddress,
} from '../../discovery/discoverEthereumAddresses';
import type { DiscoveryAbortError } from '../../discovery/discoverWallet';
import type { WalletScanReport } from '../../discovery/walletScanReport';
import { ETHEREUM_CHAIN_DEFINITIONS, type EthereumChain } from '../../ethereum/ethereumChain';
import { ScanScope } from '../ScanScope';
import { formatBitcoin } from '../formatAmount';
import { formatEthereumAmount } from '../formatEthereumAmount';
import { describeDiscoveryError, isWrongPinError } from '../messages';

type DiscoveryStepProps = {
    accounts: readonly ScannedAccount[];
    /** The Bitcoin scan failed. The accounts are the ones reached before. */
    bitcoinError?: DiscoveryError;
    /** The chains the firmware can sign for, in scan order. Empty when it cannot sign Ethereum. */
    ethereumChains: readonly EthereumChain[];
    ethereum: Record<EthereumChain, Pick<EthereumChainState, 'addresses' | 'discoveryError'>>;
    /** The device could not be read, so the whole discovery stopped. */
    error?: DiscoveryAbortError;
    report?: WalletScanReport;
    isBusy: boolean;
    isDeviceUsable: boolean;
    onStart: () => void;
    onScanMoreAccounts: () => void;
    onScanMoreAddresses: (chain: EthereumChain) => void;
    onContinue: () => void;
};

const describeScanError = (error: DiscoveryError | EthereumDiscoveryError) =>
    isWrongPinError(error)
        ? `${describeDiscoveryError(error)} The PIN is not tried again automatically. Make sure you know it before you try again.`
        : describeDiscoveryError(error);

const describeEthereumBalance = ({ info }: EthereumScannedAddress, symbol: string) => {
    if (info.isEmpty) return 'never used';

    const balance = formatEthereumAmount(info.balance, symbol);

    return info.tokens.length > 0
        ? `${balance}, ${info.tokens.length} ${info.tokens.length === 1 ? 'token' : 'tokens'}`
        : balance;
};

type BitcoinAccountsTableProps = {
    accounts: readonly ScannedAccount[];
};

const BitcoinAccountsTable = ({ accounts }: BitcoinAccountsTableProps) => (
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
                        {isEmpty ? 'never used' : formatBitcoin(snapshot.info.balance)}
                    </Table.Cell>
                </Table.Row>
            ))}
        </Table.Body>
    </Table>
);

type EthereumAddressesTableProps = {
    addresses: readonly EthereumScannedAddress[];
    symbol: string;
};

const EthereumAddressesTable = ({ addresses, symbol }: EthereumAddressesTableProps) => (
    <Table>
        <Table.Header>
            <Table.Row>
                <Table.Cell>Path</Table.Cell>
                <Table.Cell>Address</Table.Cell>
                <Table.Cell align="end">Balance</Table.Cell>
            </Table.Row>
        </Table.Header>
        <Table.Body>
            {addresses.map(scanned => (
                <Table.Row key={`${scanned.account.slip44}-${scanned.account.index}`}>
                    <Table.Cell>{formatPath(scanned.account.path)}</Table.Cell>
                    <Table.Cell>{scanned.account.address}</Table.Cell>
                    <Table.Cell align="end">{describeEthereumBalance(scanned, symbol)}</Table.Cell>
                </Table.Row>
            ))}
        </Table.Body>
    </Table>
);

export const DiscoveryStep = ({
    accounts,
    bitcoinError,
    ethereumChains,
    ethereum,
    error,
    report,
    isBusy,
    isDeviceUsable,
    onStart,
    onScanMoreAccounts,
    onScanMoreAddresses,
    onContinue,
}: DiscoveryStepProps) => {
    const chains = ethereumChains.map(chain => ({
        chain,
        label: ETHEREUM_CHAIN_DEFINITIONS[chain].label,
        symbol: ETHEREUM_CHAIN_DEFINITIONS[chain].symbol,
        addresses: ethereum[chain].addresses,
        error: ethereum[chain].discoveryError,
    }));
    const hasFunds =
        hasBitcoinToMove(accounts) || chains.some(({ addresses }) => hasEthereumToMove(addresses));
    const hasCoinError =
        bitcoinError !== undefined || chains.some(chain => chain.error !== undefined);
    const hasAnyError = error !== undefined || hasCoinError;
    const hasStarted =
        isBusy ||
        hasAnyError ||
        accounts.length > 0 ||
        chains.some(({ addresses }) => addresses.length > 0);
    // The report exists once the whole scan finished, with or without a server error of a
    // single coin. A device error leaves no report, so only a new search can follow.
    const isDiscovered = report !== undefined && error === undefined;

    return (
        <Card>
            <Column gap={16} alignItems="flex-start">
                <H2>Finding your coins</H2>
                {!hasStarted && (
                    <Paragraph>
                        The Trezor will be asked for the public keys of its Bitcoin accounts
                        {ethereumChains.length > 0 &&
                            ', then for its Ethereum and Ethereum Classic addresses one by one, until the first one that was never used'}
                        . It may ask for your PIN.
                    </Paragraph>
                )}
                {(accounts.length > 0 || bitcoinError !== undefined) && (
                    <Column gap={8} width="100%">
                        <H4>Bitcoin</H4>
                        {accounts.length > 0 && <BitcoinAccountsTable accounts={accounts} />}
                        {bitcoinError && (
                            <Banner
                                intent="critical"
                                description={describeScanError(bitcoinError)}
                            />
                        )}
                    </Column>
                )}
                {chains
                    .filter(chain => chain.addresses.length > 0 || chain.error !== undefined)
                    .map(chain => (
                        <Column key={chain.chain} gap={8} width="100%">
                            <H4>{chain.label}</H4>
                            {chain.addresses.length > 0 && (
                                <EthereumAddressesTable
                                    addresses={chain.addresses}
                                    symbol={chain.symbol}
                                />
                            )}
                            {chain.error && (
                                <Banner
                                    intent="critical"
                                    description={describeScanError(chain.error)}
                                />
                            )}
                        </Column>
                    ))}
                {error && (
                    <Banner
                        intent="critical"
                        title="The search stopped"
                        description={describeScanError(error)}
                    />
                )}
                {report && !error && !isBusy && (
                    <>
                        {!hasFunds && (
                            <Banner
                                intent="info"
                                description="Nothing to move was found in the scanned accounts and addresses. If you expected something, it may be behind a different passphrase, or further down than the scan went."
                            />
                        )}
                        <ScanScope report={report} />
                    </>
                )}
                <Row gap={8} flexWrap="wrap">
                    {(!isDiscovered || hasAnyError) && (
                        <Button isLoading={isBusy} isDisabled={!isDeviceUsable} onClick={onStart}>
                            {hasAnyError ? 'Try again' : 'Search'}
                        </Button>
                    )}
                    {isDiscovered && (
                        <>
                            <Button isDisabled={isBusy || !hasFunds} onClick={onContinue}>
                                Continue
                            </Button>
                            {bitcoinError === undefined && (
                                <Button
                                    priority="secondary"
                                    isLoading={isBusy}
                                    isDisabled={!isDeviceUsable}
                                    onClick={onScanMoreAccounts}
                                >
                                    Scan more Bitcoin accounts
                                </Button>
                            )}
                            {chains
                                .filter(chain => chain.error === undefined)
                                .map(({ chain, symbol }) => (
                                    <Button
                                        key={chain}
                                        priority="secondary"
                                        isLoading={isBusy}
                                        isDisabled={!isDeviceUsable}
                                        onClick={() => onScanMoreAddresses(chain)}
                                    >
                                        Scan more {symbol} addresses
                                    </Button>
                                ))}
                        </>
                    )}
                </Row>
            </Column>
        </Card>
    );
};
