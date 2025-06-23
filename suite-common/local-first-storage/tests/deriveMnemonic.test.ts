import { deriveMnemonic } from '../src/deriveMnemonic';

describe(deriveMnemonic.name, () => {
    it('realistic deviceStaticSessionId', () => {
        const emptyPassphrase = '2e80aa3b5557a68002f1f15e4ed0f8c6928facd0c644e3b9acab8a77172073e0';
        const withPassphrase = 'c3fda511299292aaed64509f2509e3451edf4f50e3c30ae1d3b965fc5a212df6';

        expect(deriveMnemonic(emptyPassphrase)).toBe(
            'report inject jump sail gospel grit invest lonely giraffe life palace lazy',
        );
        expect(deriveMnemonic(withPassphrase)).toBe(
            'romance middle detail exhibit cart bless injury act special clerk repair impose',
        );
    });
});
