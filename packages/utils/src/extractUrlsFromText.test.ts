import { extractUrlsFromText } from './extractUrlsFromText';

describe('extractUrlsFromText', () => {
    it.each(['t.me', 'T.ME'])('preserves text order when a name starts with %s', domain => {
        const { textParts, urls } = extractUrlsFromText(`${domain}/reward - Visit to claim`);

        expect(textParts).toEqual(['', ' - Visit to claim']);
        expect(urls).toEqual([`${domain}/reward`]);
    });

    it.each([
        't.me/S/US_POOL',
        'T.ME/S/US_POOL',
        'example.com/claim?token=reward&amount=1#details',
        'example.com/',
    ])('includes the complete path, query and fragment in the bare URL %s', url => {
        const { textParts, urls } = extractUrlsFromText(`Claim at ${url} now`);

        expect(textParts).toEqual(['Claim at ', ' now']);
        expect(urls).toEqual([url]);
    });

    it('keeps parentheses and trailing punctuation outside a bare URL with a path', () => {
        const { textParts, urls } = extractUrlsFromText(
            'Reward (t.me/S/US_POOL), visit example.com/claim.',
        );

        expect(textParts).toEqual(['Reward (', '), visit ', '.']);
        expect(urls).toEqual(['t.me/S/US_POOL', 'example.com/claim']);
    });

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

        expect(textParts).toEqual(['🎁10K$ gift at [', ']']);
        expect(urls).toEqual(['bit.ly/tpepe']);
    });

    it('should not match url in of contract address', () => {
        const text = '0xcDa4e840411C00a614aD9205CAEC807c7458a0E3';

        const { textParts, urls } = extractUrlsFromText(text);

        expect(textParts).toEqual(['0xcDa4e840411C00a614aD9205CAEC807c7458a0E3']);
        expect(urls).toEqual([]);
    });

    it('should match url with a space before the dot', () => {
        const text = 'Claim rewards at vanity-eth .net';

        const { textParts, urls } = extractUrlsFromText(text);

        expect(textParts).toEqual(['Claim rewards at ']);
        expect(urls).toEqual(['vanity-eth .net']);
    });

    it('should match url with a space after the dot', () => {
        const text = 'Claim rewards at vanity-eth. net';

        const { textParts, urls } = extractUrlsFromText(text);

        expect(textParts).toEqual(['Claim rewards at ']);
        expect(urls).toEqual(['vanity-eth. net']);
    });

    it('should match url with spaces around the dot', () => {
        const text = 'Claim rewards at vanity-eth . net';

        const { textParts, urls } = extractUrlsFromText(text);

        expect(textParts).toEqual(['Claim rewards at ']);
        expect(urls).toEqual(['vanity-eth . net']);
    });

    it('should match url with a non-breaking space before the dot', () => {
        const text = 'Claim rewards at vanity-eth\u00a0.net';

        const { textParts, urls } = extractUrlsFromText(text);

        expect(textParts).toEqual(['Claim rewards at ']);
        expect(urls).toEqual(['vanity-eth\u00a0.net']);
    });

    it('should match two urls next to each other', () => {
        const text = 'Visit trezor.io ledger.com';

        const { textParts, urls } = extractUrlsFromText(text);

        expect(textParts).toEqual(['Visit ', ' ']);
        expect(urls).toEqual(['trezor.io', 'ledger.com']);
    });

    it('should match url spelled in lookalike letters', () => {
        const text = 'ᴄʟᴀɪᴍ👉ᴡᴡᴡ.ᴡɪɴᴘʜᴀɴᴛᴏᴍ.ᴄᴏᴍ';

        const { textParts, urls } = extractUrlsFromText(text);

        expect(textParts).toEqual(['ᴄʟᴀɪᴍ👉']);
        expect(urls).toEqual(['ᴡᴡᴡ.ᴡɪɴᴘʜᴀɴᴛᴏᴍ.ᴄᴏᴍ']);
    });
});
