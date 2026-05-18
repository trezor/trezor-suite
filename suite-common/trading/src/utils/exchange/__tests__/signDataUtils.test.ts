import { type Account } from '@suite-common/wallet-types';

import { accountEth } from '../../../__fixtures__/utils';
import { formatMessageValue, getSignerAddress, simplifyJSON } from '../signDataUtils';

describe('simplifyJSON', () => {
    it('returns empty string for nullish input', () => {
        expect(simplifyJSON(undefined)).toBe('');
        expect(simplifyJSON(null)).toBe('');
    });

    it('strips JSON punctuation and trims', () => {
        const result = simplifyJSON({ name: 'USDC', version: '2' });
        expect(result).toBe('name: USDC\nversion: 2');
    });

    it('serializes bigints via toString', () => {
        const result = simplifyJSON({ chainId: 1n });
        expect(result).toBe('chainId: 1');
    });

    it('flattens nested objects', () => {
        const result = simplifyJSON({ outer: { inner: 'value' } });
        expect(result).toContain('outer:');
        expect(result).toContain('inner: value');
    });
});

describe('formatMessageValue', () => {
    it('returns empty string for nullish values', () => {
        expect(formatMessageValue(undefined)).toBe('');
        expect(formatMessageValue(null)).toBe('');
    });

    it('stringifies bigints', () => {
        expect(formatMessageValue(42n)).toBe('42');
    });

    it('uses simplifyJSON for objects', () => {
        expect(formatMessageValue({ a: 1 })).toBe('a: 1');
    });

    it('coerces primitives to string', () => {
        expect(formatMessageValue(7)).toBe('7');
        expect(formatMessageValue(true)).toBe('true');
        expect(formatMessageValue('hello')).toBe('hello');
    });
});

describe('getSignerAddress', () => {
    it('returns undefined when no account is provided', () => {
        expect(getSignerAddress(undefined)).toBeUndefined();
    });

    it('returns the unused address for an ethereum account', () => {
        expect(getSignerAddress(accountEth as unknown as Account)).toBe('eth-descriptor');
    });
});
