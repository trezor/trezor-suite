import { NATIVE_DECIMALS, toNativeAmount } from './nativeAsset';

describe(toNativeAmount.name, () => {
    it('scales a lower-precision mirror up to native decimals', () => {
        expect(toNativeAmount(9_913n, 6)).toBe(9_913n * 10n ** 12n);
    });

    it('leaves an amount already in native decimals untouched', () => {
        expect(toNativeAmount(9_913_568_508_319_474n, NATIVE_DECIMALS)).toBe(
            9_913_568_508_319_474n,
        );
    });

    it('scales a higher-precision mirror down', () => {
        expect(toNativeAmount(1_000n, NATIVE_DECIMALS + 3)).toBe(1n);
    });
});
