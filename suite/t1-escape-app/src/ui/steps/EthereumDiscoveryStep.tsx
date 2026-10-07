import { Banner, Button, Card, Column, H2, Paragraph, Row, Table } from '@trezor/components';

import { formatPath } from '../../bitcoin/accountType';
import type {
    EthereumDiscoveryError,
    EthereumScannedAddress,
} from '../../discovery/discoverEthereumAddresses';
import type { EthereumScanReport } from '../../discovery/ethereumScanReport';
import { ETHEREUM_CHAIN_DEFINITIONS, type EthereumChain } from '../../ethereum/ethereumChain';
import { EthereumScanScope } from '../EthereumScanScope';
import { describeEthereumDiscoveryError } from '../ethereumMessages';
import { formatEthereumAmount } from '../formatEthereumAmount';
import { isWrongPinError } from '../messages';

type EthereumDiscoveryStepProps = {
    chain: EthereumChain;
    addresses: readonly EthereumScannedAddress[];
    report?: EthereumScanReport;
    error?: EthereumDiscoveryError;
    isBusy: boolean;
    isDeviceUsable: boolean;
    onStart: () => void;
    onScanMore: () => void;
    onContinue: () => void;
    onChangeCoin: () => void;
};

const describeBalance = ({ info }: EthereumScannedAddress, symbol: string) => {
    if (info.isEmpty) return 'never used';

    const balance = formatEthereumAmount(info.balance, symbol);

    return info.tokens.length > 0
        ? `${balance}, ${info.tokens.length} ${info.tokens.length === 1 ? 'token' : 'tokens'}`
        : balance;
};

export const EthereumDiscoveryStep = ({
    chain,
    addresses,
    report,
    error,
    isBusy,
    isDeviceUsable,
    onStart,
    onScanMore,
    onContinue,
    onChangeCoin,
}: EthereumDiscoveryStepProps) => {
    const { label, symbol, slip44s } = ETHEREUM_CHAIN_DEFINITIONS[chain];
    const hasFunds = addresses.some(({ info }) => info.balance !== '0');
    const hasStarted = addresses.length > 0 || isBusy || error !== undefined;

    return (
        <Card>
            <Column gap={16} alignItems="flex-start">
                <H2>Finding your {symbol}</H2>
                {!hasStarted && (
                    <Paragraph>
                        The Trezor will be asked for its {label} addresses, one by one, until the
                        first one that was never used. It may ask for your PIN.{' '}
                        {slip44s.length > 1 &&
                            'Both the Ethereum Classic paths and the Ethereum paths are checked, because wallets from the years after the fork kept ETC on the Ethereum keys.'}
                    </Paragraph>
                )}
                {addresses.length > 0 && (
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
                                <Table.Row
                                    key={`${scanned.account.slip44}-${scanned.account.index}`}
                                >
                                    <Table.Cell>{formatPath(scanned.account.path)}</Table.Cell>
                                    <Table.Cell>{scanned.account.address}</Table.Cell>
                                    <Table.Cell align="end">
                                        {describeBalance(scanned, symbol)}
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
                                ? `${describeEthereumDiscoveryError(error)} The PIN is not tried again automatically. Make sure you know it before you try again.`
                                : describeEthereumDiscoveryError(error)
                        }
                    />
                )}
                {report && !isBusy && !error && (
                    <>
                        {!hasFunds && (
                            <Banner
                                intent="info"
                                description={`No ${symbol} was found on the scanned addresses. If you expected some, it may be behind a different passphrase or on an address further down.`}
                            />
                        )}
                        <EthereumScanScope report={report} />
                    </>
                )}
                <Row gap={8} flexWrap="wrap">
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
                                Scan more addresses
                            </Button>
                        </>
                    )}
                    <Button priority="secondary" isDisabled={isBusy} onClick={onChangeCoin}>
                        Choose another coin
                    </Button>
                </Row>
            </Column>
        </Card>
    );
};
