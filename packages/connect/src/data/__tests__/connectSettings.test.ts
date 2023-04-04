import { corsValidator } from '../connectSettings';

describe('data/connectSettings', () => {
    it('corsValidator', () => {
        expect(corsValidator('https://connect.trezor.io/9-beta/')).toBeDefined();
        expect(corsValidator('https://az-AZ_123.trezor.io/')).toBeDefined();
        expect(corsValidator('https://multiple.sub.domain.trezor.io/')).toBeDefined();
        expect(corsValidator('https://trezor.sldev.io/')).not.toBeDefined();
        expect(corsValidator('https://testxtrezor.io/')).not.toBeDefined();
        expect(corsValidator('https://testxtrezorxio/')).not.toBeDefined();
        expect(corsValidator('https://non!alpha*numeric?.trezor.io/')).not.toBeDefined();
        expect(corsValidator('https://connect.trezor.io')).not.toBeDefined(); // missing slash at the end
        expect(corsValidator('http://connect.trezor.io/')).not.toBeDefined(); // missing https
        expect(corsValidator('https://localhost:8088/')).toBeDefined();
        expect(corsValidator('https://localhost:5088/')).toBeDefined();
        expect(corsValidator('https://localhost:8088/subdir/')).toBeDefined();
        expect(corsValidator('http://localhost:8088/')).toBeDefined();
        expect(corsValidator('https://connect.sldev.cz/')).toBeDefined();
        expect(corsValidator('https://az-AZ_123.sldev.cz/')).toBeDefined();
        expect(corsValidator('https://multiple.sub.domain.sldev.cz/')).toBeDefined();
        expect(corsValidator('https://sldev.trezor.cz/')).not.toBeDefined();
        expect(corsValidator('https://testxsldev.cz/')).not.toBeDefined();
        expect(corsValidator('https://testxsldevxcz/')).not.toBeDefined();
        expect(corsValidator('https://non!alpha*numeric?.sldev.cz/')).not.toBeDefined();
        expect(corsValidator('https://connect.sldev.cz')).not.toBeDefined(); // missing slash at the end
        expect(corsValidator('http://connect.sldev.cz/')).not.toBeDefined(); // missing https
        // @ts-expect-error
        expect(corsValidator(null)).not.toBeDefined();
        expect(corsValidator(undefined)).not.toBeDefined();
        // @ts-expect-error
        expect(corsValidator({})).not.toBeDefined();
        // @ts-expect-error
        expect(corsValidator(1)).not.toBeDefined();
        expect(corsValidator('https://other-domain.com/connect.trezor.io/9/')).not.toBeDefined();
    });
});
