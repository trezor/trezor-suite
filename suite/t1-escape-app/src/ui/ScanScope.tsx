import { Column, H4, Paragraph } from '@trezor/components';

import { BulletList } from './BulletList';
import { describeWalletKind } from './messages';
import type { ScanReport } from '../discovery/scanReport';

type ScanScopeProps = {
    report: ScanReport;
};

/** What the scan covered and, just as prominently, what it did not. */
export const ScanScope = ({ report }: ScanScopeProps) => (
    <Column gap={16}>
        <Column gap={8}>
            <H4>Scanned</H4>
            <BulletList>
                <BulletList.Item>Coin: {report.coin} only</BulletList.Item>
                <BulletList.Item>Wallet: {describeWalletKind(report.walletKind)}</BulletList.Item>
                {report.accountTypes.map(type => (
                    <BulletList.Item key={type.accountType}>
                        {type.label} accounts: {type.scannedAccounts} scanned ({type.firstPath} to{' '}
                        {type.lastPath}), {type.usedAccounts} with history
                    </BulletList.Item>
                ))}
                <BulletList.Item>
                    Addresses: up to {report.addressGap} unused addresses in a row per account
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
                <BulletList.Item>Accounts beyond the ones listed above.</BulletList.Item>
                <BulletList.Item>
                    Account types this firmware cannot sign for:{' '}
                    {report.skippedAccountTypes.join(', ')}.
                </BulletList.Item>
                <BulletList.Item>Custom derivation paths and multisig wallets.</BulletList.Item>
                <BulletList.Item>
                    Every other coin, including forks that share Bitcoin keys, such as Bitcoin Cash
                    and Bitcoin Gold, for wallets used before August 2017.
                </BulletList.Item>
                <BulletList.Item>
                    Things derived from the seed that are not coins: U2F registrations, Password
                    Manager entries, SSH and GPG keys.
                </BulletList.Item>
            </BulletList>
        </Column>
    </Column>
);
