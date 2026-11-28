import { Column, H4, Paragraph } from '@trezor/components';

import { BulletList } from './BulletList';
import { describeWalletKind } from './messages';
import type { WalletScanReport } from '../discovery/walletScanReport';
import { MIN_ETHEREUM_FIRMWARE, formatFirmwareVersion } from '../firmware/firmwareSupport';

type ScanScopeProps = {
    report: WalletScanReport;
};

/** What the scan covered, coin by coin, and just as prominently what it did not. */
export const ScanScope = ({ report }: ScanScopeProps) => {
    const { bitcoin, ethereum, interruptedCoins } = report;
    const isEthereumScanned = ethereum.length > 0;

    return (
        <Column gap={16}>
            <Column gap={8}>
                <H4>Scanned</H4>
                <BulletList>
                    <BulletList.Item>
                        Wallet: {describeWalletKind(report.walletKind)}
                    </BulletList.Item>
                    {bitcoin.accountTypes.map(type => (
                        <BulletList.Item key={type.accountType}>
                            Bitcoin, {type.label} accounts: {type.scannedAccounts} scanned (
                            {type.firstPath} to {type.lastPath}), {type.usedAccounts} with history
                        </BulletList.Item>
                    ))}
                    <BulletList.Item>
                        Bitcoin addresses: up to {bitcoin.addressGap} unused addresses in a row per
                        account
                    </BulletList.Item>
                    {ethereum.flatMap(chain =>
                        chain.pathFamilies.map(family => (
                            <BulletList.Item key={`${chain.chain}-${family.slip44}`}>
                                {chain.label} addresses {family.pattern}: {family.scannedAddresses}{' '}
                                scanned, {family.usedAddresses} with history
                            </BulletList.Item>
                        )),
                    )}
                    {isEthereumScanned && (
                        <BulletList.Item>
                            Each Ethereum path was followed up to the first address that was never
                            used.
                        </BulletList.Item>
                    )}
                    {interruptedCoins.map(coin => (
                        <BulletList.Item key={coin}>
                            {coin}: the scan stopped at a server error. Only what is listed above
                            was checked.
                        </BulletList.Item>
                    ))}
                </BulletList>
            </Column>
            <Column gap={8}>
                <H4>Not scanned</H4>
                <Paragraph>Anything in the following places is still on the old device:</Paragraph>
                <BulletList>
                    <BulletList.Item>
                        Wallets behind other passphrases. Every passphrase opens a separate wallet.
                    </BulletList.Item>
                    <BulletList.Item>
                        Bitcoin accounts and Ethereum addresses beyond the ones listed above.
                    </BulletList.Item>
                    <BulletList.Item>
                        Bitcoin account types this firmware cannot sign for:{' '}
                        {bitcoin.skippedAccountTypes.join(', ')}.
                    </BulletList.Item>
                    {!isEthereumScanned && (
                        <BulletList.Item>
                            Ethereum and Ethereum Classic. This firmware cannot sign the
                            transactions that Ethereum nodes accept today: the EIP-155 replay
                            protection came with firmware{' '}
                            {formatFirmwareVersion(MIN_ETHEREUM_FIRMWARE)}. They were not scanned.
                        </BulletList.Item>
                    )}
                    {isEthereumScanned && (
                        <>
                            <BulletList.Item>
                                ERC-20 tokens and NFTs on the scanned addresses. They stay where
                                they are.
                            </BulletList.Item>
                            <BulletList.Item>
                                Other Ethereum derivation paths, such as Ledger-style paths or other
                                account numbers, and other EVM chains that share these keys, such as
                                BNB Chain or Polygon.
                            </BulletList.Item>
                        </>
                    )}
                    <BulletList.Item>
                        Custom Bitcoin derivation paths and multisig wallets.
                    </BulletList.Item>
                    <BulletList.Item>
                        Every other coin, including forks that share Bitcoin keys, such as Bitcoin
                        Cash and Bitcoin Gold, for wallets used before August 2017.
                    </BulletList.Item>
                    <BulletList.Item>
                        Things derived from the seed that are not coins: U2F registrations, Password
                        Manager entries, SSH and GPG keys.
                    </BulletList.Item>
                </BulletList>
            </Column>
        </Column>
    );
};
