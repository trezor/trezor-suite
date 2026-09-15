import { ZERO_ADDRESS, getTokenIconSources } from './assetIconUtils';

it('prioritizes custom logos and retains token alternatives and a native fallback', () => {
    const sources = getTokenIconSources(
        'ethereum',
        ['second', 'first', 'first'],
        32,
        'https://example.com/custom.png',
    );
    expect(sources).toHaveLength(4);
    expect(sources[0]?.src).toBe('https://example.com/custom.png');
    expect(sources[1]?.src).toContain('first');
    expect(sources[2]?.src).toContain('second');
    expect(sources[3]?.src).not.toContain('/erc20/');
    expect(sources[1]?.srcSet).toContain('2x');
});

it('requests only the native logo for the native address sentinel', () => {
    expect(getTokenIconSources('ethereum', [ZERO_ADDRESS], 32)).toEqual(
        getTokenIconSources('ethereum', [], 32),
    );
    expect(getTokenIconSources('ethereum', [], 32)).toHaveLength(1);
});
