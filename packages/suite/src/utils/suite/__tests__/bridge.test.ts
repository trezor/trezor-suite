import { getLinuxPackage } from '../bridge';

const debUserAgents = [
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.80 Safari/537.36',
];

describe('getLinuxPackage', () => {
    describe('should return debian package', () => {
        debUserAgents.forEach(userAgent => {
            it(userAgent, () => {
                expect(getLinuxPackage());
            });
        });
    });
});
