import { toNanoId } from '../src/toNanoId';

describe(toNanoId.name, () => {
    it('is deterministic', () => {
        const input = 'Chancellor on the brink of second bailout for banks';

        expect(toNanoId(input)).toBe('Jh-h1l7bAS1w9o5U1DsU1');
        expect(toNanoId(input)).toBe('Jh-h1l7bAS1w9o5U1DsU1');
    });

    it('realistic deviceStaticSessionId', () => {
        const emptyPassphrase = 'mgk9T92LH4gUQCtTpECWVw6Q66ddFk8fWS@049A238B15B928738F90F3A5:1';
        const withPassphrase = 'mq1WDacLwUiyNxn3qgrARDd9GyhSKh9Ww3@049A238B15B928738F90F3A5:2';

        expect(toNanoId(emptyPassphrase)).toBe('JhUB1DJf9XsN9anf8XJk8');
        expect(toNanoId(withPassphrase)).toBe('9l4hJl1g1Snq8XENAp-f9');
    });
});
