import { extractUrlsFromText } from '../src/extractUrlsFromText';

describe('extractUrlsFromText', () => {
    it('should return textParts and urls for text with URLs', () => {
        const text =
            'Go to this page to claim your rewards: http://example.com/url and also check out www.phishing-site.com';
        const { textParts, urls } = extractUrlsFromText(text);

        expect(textParts).toEqual([
            'Go to this page to claim your rewards: ',
            ' and also check out ',
        ]);
        expect(urls).toEqual(['http://example.com/url', 'www.phishing-site.com']);
    });

    it('should handle text without URLs', () => {
        const text = 'This is a message very nice Ethereum token';
        const { textParts, urls } = extractUrlsFromText(text);

        expect(textParts).toEqual([text]);
        expect(urls).toEqual([]);
    });

    it('should not match invalid URLs like "2.0" in token name', () => {
        const text = 'Liquid staked Ether 2.0';
        const { textParts, urls } = extractUrlsFromText(text);

        expect(textParts).toEqual([text]);
        expect(urls).toEqual([]);
    });

    it('should not match invalid URLs with version in token name', () => {
        const text = 'PEPE2.0';
        const { textParts, urls } = extractUrlsFromText(text);

        expect(textParts).toEqual([text]);
        expect(urls).toEqual([]);
    });

    it('should handle text with multiple URLs related to Ethereum tokens correctly', () => {
        const text =
            'Visit https://etherscan.io, http://mycrypto.com, and www.ethereum.org to claim your tokens.';
        const { textParts, urls } = extractUrlsFromText(text);

        expect(textParts).toEqual(['Visit ', ', ', ', and ', ' to claim your tokens.']);
        expect(urls).toEqual(['https://etherscan.io', 'http://mycrypto.com', 'www.ethereum.org']);
    });

    it('should correctly extract URLs from phishing messages related to Ethereum', () => {
        const text =
            'Attention! Go to http://phishing-site.com to secure your Ethereum wallet immediately.';
        const { textParts, urls } = extractUrlsFromText(text);

        expect(textParts).toEqual([
            'Attention! Go to ',
            ' to secure your Ethereum wallet immediately.',
        ]);
        expect(urls).toEqual(['http://phishing-site.com']);
    });

    it('should not match any url in case of USDT name', () => {
        const text = 'Tether USD';
        const { textParts, urls } = extractUrlsFromText(text);

        expect(textParts).toEqual([text]);
        expect(urls).toEqual([]);
    });

    it('should not match any url in case of USDT symbol', () => {
        const text = 'USDT';
        const { textParts, urls } = extractUrlsFromText(text);

        expect(textParts).toEqual([text]);
        expect(urls).toEqual([]);
    });

    it('should match url in case of just url', () => {
        const text = 'USDT.io';
        const { textParts, urls } = extractUrlsFromText(text);

        expect(textParts).toEqual(['']);
        expect(urls).toEqual([text]);
    });

    it('should match url in case of scam', () => {
        const text = '$ USDCXmas.com';
        const { textParts, urls } = extractUrlsFromText(text);

        expect(textParts).toEqual(['$ ']);
        expect(urls).toEqual(['USDCXmas.com']);
    });

    it('should match url in case scam name with emoji', () => {
        const text = '🎁10K$ gift at [bit.ly/tpepe]';

        const { textParts, urls } = extractUrlsFromText(text);

        expect(textParts).toEqual(['🎁10K$ gift at [', '/tpepe]']);
        expect(urls).toEqual(['bit.ly']);
    });

    it('should not match url in of contract address', () => {
        const text = '0xcDa4e840411C00a614aD9205CAEC807c7458a0E3';

        const { textParts, urls } = extractUrlsFromText(text);

        expect(textParts).toEqual(['0xcDa4e840411C00a614aD9205CAEC807c7458a0E3']);
        expect(urls).toEqual([]);
    });

    it('should match two urls next to each other', () => {
        const text = 'Visit trezor.io ledger.com';

        const { textParts, urls } = extractUrlsFromText(text);

        expect(textParts).toEqual(['Visit ', ' ']);
        expect(urls).toEqual(['trezor.io', 'ledger.com']);
    });
});
