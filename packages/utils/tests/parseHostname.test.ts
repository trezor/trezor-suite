import { parseHostname } from '../src/parseHostname';

const fixtures = [
    ['localHOst', 'localhost'],
    ['localhost.cz:3', 'localhost.cz'],
    ['wss://btc1.trezor.io/foo', 'btc1.trezor.io'],
    ['127.0.0.1:9050/?a=b', '127.0.0.1'],
    ['http://suite.trezor.io/', 'suite.trezor.io'],
    ['electrum.exAMple.com:50001:t', 'electrum.example.com'],
    ['electrum.example.onion:50001:t?abcd', 'electrum.example.onion'],
    ['a35sf65dFH67awd.onion:999:s', 'a35sf65dfh67awd.onion'],
    [''],
    ['ws://'],
    ['http://a.b://c.d'],
    ['invalid url'],
] as const;

describe('parseHostname', () => {
    it('parseHostname', () => {
        fixtures.forEach(([url, hostname]) => {
            expect(parseHostname(url)).toEqual(hostname);
        });
    });
});
