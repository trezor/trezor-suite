import { urlToOnion } from '../src/urlToOnion';

const DICT = {
    'trezor.io': 'trezorioabcd.onion',
    'coingecko.com': 'coingeckoabcd.onion',
};

const FIXTURE = [
    ['invalid domain', 'aaaa', undefined],
    ['unknown domain', 'http://www.something.test', undefined],
    ['missing protocol', 'trezor.io', undefined],
    ['simple domain http', 'https://trezor.io/', `http://trezorioabcd.onion/`],
    ['simple domain https', 'https://trezor.io/', `http://trezorioabcd.onion/`],
    ['subdomain', 'https://cdn.trezor.io/x/1*ab.png', `http://cdn.trezorioabcd.onion/x/1*ab.png`],
    ['subsubdomain', 'http://alpha.beta.trezor.io', `http://alpha.beta.trezorioabcd.onion`],
    ['blockbook', 'https://btc1.trezor.io/api?t=13#a', `http://btc1.trezorioabcd.onion/api?t=13#a`],
    ['coingecko', 'https://coingecko.com/?dt=5-1-2021', `http://coingeckoabcd.onion/?dt=5-1-2021`],
    ['websocket wss', 'wss://trezor.io', 'ws://trezorioabcd.onion'],
    ['websocket ws', 'ws://foo.bar.trezor.io/?foo=bar', 'ws://foo.bar.trezorioabcd.onion/?foo=bar'],
    ['duplicate match', 'http://trezor.io/trezor.io', 'http://trezorioabcd.onion/trezor.io'],
    ['false match', 'http://a.test/b?url=trezor.io', undefined],
] as [string, string, string | undefined][];

describe('urlToOnion', () => {
    FIXTURE.forEach(([desc, clear, onion]) =>
        it(desc, () => expect(urlToOnion(clear, DICT)).toBe(onion)),
    );
});
