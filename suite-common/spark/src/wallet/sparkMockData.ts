import type { WalletDescriptor } from '@suite-common/wallet-types';

type SparkTransferLike = {
    amountSats: string;
    counterparty: string;
    createdAt: string;
    direction: 'send' | 'receive';
    id: string;
    rail: 'bitcoin' | 'lightning';
    status: 'completed';
    summary: string;
};

const sanitizeWalletDescriptor = (walletDescriptor: WalletDescriptor) =>
    walletDescriptor
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 24)
        .padEnd(24, '0');

export const createInitialSparkBalanceSats = (accountNumber: number) =>
    (250_000 + accountNumber * 50_000).toString();

export const createSparkBitcoinDepositAddress = ({
    walletDescriptor,
    accountNumber,
}: {
    walletDescriptor: WalletDescriptor;
    accountNumber: number;
}) => `bc1qspark${sanitizeWalletDescriptor(walletDescriptor)}${accountNumber.toString(36)}`;

export const createSparkLightningInvoice = ({
    walletDescriptor,
    accountNumber,
    nonce,
}: {
    walletDescriptor: WalletDescriptor;
    accountNumber: number;
    nonce?: string;
}) => {
    const suffix = nonce
        ? nonce
              .replace(/[^a-zA-Z0-9]/g, '')
              .slice(-10)
              .toLowerCase()
        : 'seed';

    return `lnbc1spark${sanitizeWalletDescriptor(walletDescriptor)}${accountNumber.toString(36)}${suffix}`;
};

export const createInitialSparkTransfers = ({
    walletDescriptor,
    accountNumber,
}: {
    walletDescriptor: WalletDescriptor;
    accountNumber: number;
}): SparkTransferLike[] => [
    {
        id: `${walletDescriptor}:${accountNumber}:bootstrap`,
        amountSats: createInitialSparkBalanceSats(accountNumber),
        counterparty: 'Spark faucet',
        createdAt: '2026-04-01T00:00:00.000Z',
        direction: 'receive',
        rail: 'lightning',
        status: 'completed',
        summary: 'Mocked inbound Spark liquidity',
    },
];
