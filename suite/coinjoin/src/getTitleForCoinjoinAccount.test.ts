import { type NetworkSymbolExtended } from '@suite-common/wallet-config';
import { getTitleForCoinjoinAccount } from '@suite-common/wallet-utils';

const accountTitleCoinjoinFixture: Array<{
    symbol: NetworkSymbolExtended;
    title: ReturnType<typeof getTitleForCoinjoinAccount>;
}> = [
    { symbol: 'btc', title: 'TR_NETWORK_COINJOIN_BITCOIN' },
    { symbol: 'eth', title: 'TR_NETWORK_COINJOIN_BITCOIN' },
    { symbol: 'test', title: 'TR_NETWORK_COINJOIN_BITCOIN_TESTNET' },
    { symbol: 'regtest', title: 'TR_NETWORK_COINJOIN_BITCOIN_REGTEST' },
];

describe('getTitleForCoinjoinAccount', () => {
    accountTitleCoinjoinFixture.forEach(fixture => {
        it(fixture.symbol, () => {
            expect(getTitleForCoinjoinAccount(fixture.symbol)).toBe(fixture.title);
        });
    });
});
