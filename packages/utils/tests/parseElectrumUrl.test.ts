import { parseElectrumUrl } from '../src/parseElectrumUrl';

const FIXTURE = [
    ['electrum.example.com:50001:t', 'electrum.example.com', 50001, 't'],
    ['electrum.example.com:50001:s', 'electrum.example.com', 50001, 's'],
    ['electrum.example.onion:50001:t', 'electrum.example.onion', 50001, 't'],
    ['electrum.example.com:50001:x'],
    ['127.0.0.1:50001:t', '127.0.0.1', 50001, 't'],
    ['2001:0db8:85a3:0000:0000:8a2e:0370:7334:50001:t'],
    [
        '[2001:0db8:85a3:0000:0000:8a2e:0370:7334]:50001:t',
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        50001,
        't',
    ],
    ['[::1]:50001:t', '::1', 50001, 't'],
    ['[example.com]:50001:t'],
    ['wss://blockfrost.io'],
    ['https://google.com'],
    [''],
] as const;

describe('parseElectrumUrl', () => {
    FIXTURE.forEach(([url, host, port, protocol]) =>
        it(url, () => {
            expect(parseElectrumUrl(url)).toStrictEqual(host && { host, port, protocol });
        }),
    );
});
