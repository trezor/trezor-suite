import { Code, Table, Td, Th, Tr } from 'nextra/components';

import { isCoinSymbol } from '@trezor/connect-common/src/types/coinInfo';
import coinsEth from '@trezor/connect-data/files/coins-eth.json';
import coins from '@trezor/connect-data/files/coins.json';

const TREZOR_DOMAIN = 'trezor.io';

// Method family covering each network outside of the Bitcoin and EVM groups. The coin definitions
// carry no link to the API surface, so this mapping is maintained here; a network with no entry is
// still a valid `coin` value, it just has no methods of its own.
const methodFamilies: Record<string, string> = {
    ada: 'cardano*',
    tada: 'cardano*',
    sol: 'solana*',
    dsol: 'solana*',
    xrp: 'ripple*',
    txrp: 'ripple*',
    xlm: 'stellar*',
    txlm: 'stellar*',
    trx: 'tron*',
    ttrx: 'tron*',
    xmr: 'monero*',
    xtz: 'tezos*',
    nostr: 'nostr*',
};

// Shape of a single entry in the bundled coin definitions. Only the fields this table renders are
// declared; `chain_id` is present on EVM networks only, and `blockchain_link` is null for a network
// Connect ships no default backend for.
interface CoinDefinition {
    shortcut: string;
    name: string;
    slip44: number;
    chain_id?: number;
    blockchain_link?: { type: string; url: string[] } | null;
}

// Registrable domain of each backend URL, ours first, so a reader can tell at a glance whether the
// default backend is one of ours or a third-party service. The last two labels are enough for every
// host in the coin definitions.
const backendDomains = (urls: string[]) => {
    const domains = new Set(urls.map(url => new URL(url).hostname.split('.').slice(-2).join('.')));

    return [...domains].sort((a, b) => {
        if (a === TREZOR_DOMAIN) return -1;
        if (b === TREZOR_DOMAIN) return 1;

        return a.localeCompare(b);
    });
};

const toRows = (definitions: CoinDefinition[]) =>
    definitions
        .map(definition => ({
            symbol: definition.shortcut.toLowerCase(),
            name: definition.name,
            slip44: definition.slip44,
            chainId: definition.chain_id,
            backendDomains: backendDomains(definition.blockchain_link?.url ?? []),
        }))
        // Definitions the public `coin` param does not accept are left out.
        .filter(row => isCoinSymbol(row.symbol))
        .sort((a, b) => a.name.localeCompare(b.name));

const rowsByCategory = {
    bitcoin: toRows(coins.bitcoin),
    eth: toRows(coinsEth.eth),
    misc: toRows(coins.misc),
};

interface CoinsTableProps {
    category: keyof typeof rowsByCategory;
}

export const CoinsTable = ({ category }: CoinsTableProps) => (
    <Table className="nextra-scrollbar nx-mt-6">
        <thead>
            <Tr>
                <Th>
                    <Code>coin</Code>
                </Th>
                <Th>Network</Th>
                {category === 'eth' && <Th>Chain ID</Th>}
                <Th>SLIP-44</Th>
                {category === 'misc' && <Th>Methods</Th>}
                <Th>Backend support</Th>
            </Tr>
        </thead>
        <tbody>
            {rowsByCategory[category].map(row => (
                <Tr key={row.symbol}>
                    <Td>
                        <Code>{`'${row.symbol}'`}</Code>
                    </Td>
                    <Td>{row.name}</Td>
                    {category === 'eth' && <Td>{row.chainId}</Td>}
                    <Td>{row.slip44}</Td>
                    {category === 'misc' && (
                        <Td>
                            {methodFamilies[row.symbol] ? (
                                <Code>{methodFamilies[row.symbol]}</Code>
                            ) : (
                                '—'
                            )}
                        </Td>
                    )}
                    <Td>{row.backendDomains.join(', ') || '—'}</Td>
                </Tr>
            ))}
        </tbody>
    </Table>
);
