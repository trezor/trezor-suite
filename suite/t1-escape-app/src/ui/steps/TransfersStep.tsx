import { Banner, Button, Card, Column, H2, H3, Paragraph, Row } from '@trezor/components';

import {
    type BitcoinState,
    type EthereumChainState,
    isEthereumTransferUnsettled,
    isTransferUnsettled,
} from '../../app/migrationState';
import {
    ETHEREUM_CHAINS,
    ETHEREUM_CHAIN_DEFINITIONS,
    type EthereumChain,
} from '../../ethereum/ethereumChain';
import {
    type FirmwareVersion,
    isAffectedBySegwitAmountVulnerability,
    showsEthereumAddressChecksum,
} from '../../firmware/firmwareSupport';
import { BulletList } from '../BulletList';
import { EthereumTransferCard } from '../EthereumTransferCard';
import { TransferCard } from '../TransferCard';

type TransferCallbacks = {
    onSign: (key: string) => void;
    onBroadcast: (key: string) => void;
    onRetry: (key: string) => void;
};

type TransfersStepProps = TransferCallbacks & {
    bitcoin: Pick<BitcoinState, 'transfers' | 'destination'>;
    ethereum: Record<EthereumChain, Pick<EthereumChainState, 'transfers' | 'destination'>>;
    firmwareVersion: FirmwareVersion;
    isBusy: boolean;
    isDeviceUsable: boolean;
    isDeviceReleased: boolean;
    onRefresh: () => void;
    onEditDestinations: () => void;
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

type CoinHeaderProps = {
    label: string;
    destinationAddress: string;
};

const CoinHeader = ({ label, destinationAddress }: CoinHeaderProps) => (
    <Card>
        <Column gap={4} alignItems="flex-start">
            <H3>{label}</H3>
            <Paragraph>
                Everything goes to <strong>{destinationAddress}</strong>.
            </Paragraph>
        </Column>
    </Card>
);

export const TransfersStep = ({
    bitcoin,
    ethereum,
    firmwareVersion,
    isBusy,
    isDeviceUsable,
    isDeviceReleased,
    onSign,
    onBroadcast,
    onRetry,
    onRefresh,
    onEditDestinations,
    onFinish,
}: TransfersStepProps) => {
    // A chain has a destination exactly when it had something to move.
    const ethereumChains = ETHEREUM_CHAINS.flatMap(chain => {
        const { destination, transfers } = ethereum[chain];

        return destination ? [{ chain, destination, transfers }] : [];
    });
    const ethereumTransfers = ethereumChains.flatMap(({ transfers }) => transfers);
    const stages = [...bitcoin.transfers, ...ethereumTransfers].map(({ stage }) => stage);

    const isAnythingSigned = stages.some(stage => stage !== 'ready');
    // A transfer that is signed but not sent yet can still be followed by further ones, which
    // are composed only after it is sent. Locking the Trezor before that would strand them.
    const hasTransfersToSign =
        bitcoin.transfers.some(
            ({ stage, plan, followingTransactions }) =>
                (stage === 'ready' && plan !== undefined) ||
                (stage !== 'broadcast' && followingTransactions > 0),
        ) ||
        ethereumTransfers.some(
            ({ stage, plan, isInFlight }) =>
                (stage === 'ready' && plan !== undefined) || isInFlight,
        );
    const hasUnsentTransactions = stages.some(
        stage => stage === 'signed' || stage === 'broadcasting',
    );
    const hasPendingTransfers =
        bitcoin.transfers.some(isTransferUnsettled) ||
        ethereumTransfers.some(isEthereumTransferUnsettled);
    const cardProps = { isBusy, isDeviceUsable, onSign, onBroadcast, onRetry };

    return (
        <Column gap={16}>
            <Card>
                <Column gap={12} alignItems="flex-start">
                    <H2>Transfers</H2>
                    <Paragraph>
                        Each Bitcoin account type and each Ethereum address needs its own
                        transaction. The Trezor shows the destination and the amount of each one:
                        confirm only if both match this page and your new wallet.
                    </Paragraph>
                    {!isAnythingSigned && (
                        <Button
                            size="small"
                            priority="secondary"
                            isDisabled={isBusy}
                            onClick={onEditDestinations}
                        >
                            Change the addresses
                        </Button>
                    )}
                </Column>
            </Card>

            {bitcoin.destination && isAffectedBySegwitAmountVulnerability(firmwareVersion) && (
                <Banner
                    intent="critical"
                    title="Never confirm the same address with the same amount twice"
                    description={
                        <BulletList>
                            <BulletList.Item>
                                Before you confirm a bitcoin transfer on the Trezor, write the
                                amount it shows down on paper.
                            </BulletList.Item>
                            <BulletList.Item>
                                If the Trezor ever shows an address together with an amount that is
                                already on your paper, reject it on the Trezor and close this page.
                            </BulletList.Item>
                            <BulletList.Item>
                                This tool gives every bitcoin transfer a different amount, also when
                                one has to be repeated. A repeated amount means something is wrong.
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

            {bitcoin.destination && (
                <>
                    <CoinHeader label="Bitcoin" destinationAddress={bitcoin.destination.address} />
                    {bitcoin.transfers.length === 0 && (
                        <Banner
                            intent="info"
                            description="No account has bitcoin that can be moved."
                        />
                    )}
                    {bitcoin.transfers.map(transfer => (
                        <TransferCard key={transfer.key} transfer={transfer} {...cardProps} />
                    ))}
                </>
            )}

            {ethereumChains.length > 0 && !showsEthereumAddressChecksum(firmwareVersion) && (
                <Banner
                    intent="warning"
                    title="The Trezor shows Ethereum addresses in lowercase"
                    description="This firmware shows the destination without the 0x prefix and without the capital letters of the checksum. Compare the characters and ignore their case."
                />
            )}

            {ethereumChains.map(({ chain, destination, transfers }) => {
                const { label, symbol } = ETHEREUM_CHAIN_DEFINITIONS[chain];

                return (
                    <Column key={chain} gap={16}>
                        <CoinHeader label={label} destinationAddress={destination.address} />
                        {transfers.length === 0 && (
                            <Banner
                                intent="info"
                                description={`No address has ${symbol} that can be moved.`}
                            />
                        )}
                        {transfers.map(transfer => (
                            <EthereumTransferCard
                                key={transfer.key}
                                transfer={transfer}
                                symbol={symbol}
                                {...cardProps}
                            />
                        ))}
                    </Column>
                );
            })}

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
