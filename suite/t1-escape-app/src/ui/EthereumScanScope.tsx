import { Column, H4, Paragraph } from '@trezor/components';

import { BulletList } from './BulletList';
import { describeWalletKind } from './ethereumMessages';
import type { EthereumScanReport } from '../discovery/ethereumScanReport';

type EthereumScanScopeProps = {
    report: EthereumScanReport;
};

/** What the scan covered and, just as prominently, what it did not. */
export const EthereumScanScope = ({ report }: EthereumScanScopeProps) => (
    <Column gap={16}>
        <Column gap={8}>
            <H4>Scanned</H4>
            <BulletList>
                <BulletList.Item>
                    Coin: {report.label} ({report.symbol}) only
                </BulletList.Item>
                <BulletList.Item>Wallet: {describeWalletKind(report.walletKind)}</BulletList.Item>
                {report.pathFamilies.map(family => (
                    <BulletList.Item key={family.slip44}>
                        Addresses {family.pattern}: {family.scannedAddresses} scanned,{' '}
                        {family.usedAddresses} with history
                    </BulletList.Item>
                ))}
                <BulletList.Item>
                    Each path was followed up to the first address that was never used.
                </BulletList.Item>
            </BulletList>
        </Column>
        <Column gap={8}>
            <H4>Not scanned</H4>
            <Paragraph>Anything in the following places is still on the old device:</Paragraph>
            <BulletList>
                <BulletList.Item>
                    Wallets behind other passphrases. Every passphrase opens a separate wallet.
                </BulletList.Item>
                <BulletList.Item>Addresses beyond the ones listed above.</BulletList.Item>
                <BulletList.Item>
                    Other derivation paths, such as Ledger-style paths or other account numbers.
                </BulletList.Item>
                <BulletList.Item>
                    ERC-20 tokens and NFTs on the scanned addresses. They stay where they are.
                </BulletList.Item>
                <BulletList.Item>
                    Other EVM chains that share these keys, such as{' '}
                    {report.chain === 'ethereum' ? 'Ethereum Classic' : 'Ethereum'}, BNB Chain or
                    Polygon.
                </BulletList.Item>
                <BulletList.Item>
                    Bitcoin and every other coin, including forks that share Bitcoin keys, such as
                    Bitcoin Cash and Bitcoin Gold.
                </BulletList.Item>
                <BulletList.Item>
                    Things derived from the seed that are not coins: U2F registrations, Password
                    Manager entries, SSH and GPG keys.
                </BulletList.Item>
            </BulletList>
        </Column>
    </Column>
);
