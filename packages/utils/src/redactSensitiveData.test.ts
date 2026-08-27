import { redactSensitiveDataFromString } from './redactSensitiveData';

describe('redactSensitiveDataFromString', () => {
    it('redacts a JSON payload embedded in an invalid parameter error', () => {
        const message =
            'Invalid parameter "account.utxo" (= [{"txid":"1f0e3dad99908345f7439f8ffabdffc4","address":"addr1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wxhxx9r9y","amount":"1000000"}]): Expected array';

        expect(redactSensitiveDataFromString(message)).toBe(
            'Invalid parameter "account.utxo" (= [redacted]): Expected array',
        );
    });

    it('keeps bracketed text that carries no payload', () => {
        expect(redactSensitiveDataFromString('[Info] device disconnected')).toBe(
            '[Info] device disconnected',
        );
    });

    it.each([
        ['bech32 address', 'addr1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wxhxx9r9y'],
        ['bitcoin address', 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'],
        ['stake address', 'stake1uyehkck0lajq8gr28t9uxnuvgcqrc6070x3k9r8048z8y5gh6ffgw'],
        [
            'extended public key',
            'xpub6ERApfZwUNrhLCkDtcHTcxd75RbzS1ed54G1LkBUHQVHQKqhMkhgbmJbZRkrgZw4koxb5JaHWkY4ALHY2grBGRjaDMzQLcgJvLJuZZvRcEL',
        ],
        ['ethereum address', '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'],
        ['transaction id', '1f0e3dad99908345f7439f8ffabdffc41f0e3dad99908345f7439f8ffabdffc4'],
        ['solana address', '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'],
    ])('redacts %s', (_name, value) => {
        expect(redactSensitiveDataFromString(`failed for ${value} at block 42`)).toBe(
            'failed for [redacted] at block 42',
        );
    });

    it('keeps messages without any account data intact', () => {
        expect(redactSensitiveDataFromString('Device disconnected during action')).toBe(
            'Device disconnected during action',
        );
    });
});
