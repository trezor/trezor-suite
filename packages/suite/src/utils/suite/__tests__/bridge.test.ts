import { getLinuxPackage } from '../bridge';

const fixtures = [
    {
        description: 'Ubuntu with chrome',
        appVersion:
            '5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.80 Safari/537.36',
        output: 'deb',
    },
    {
        description: 'Mac with chrome',
        appVersion:
            '5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.61 Safari/537.36',
        output: undefined,
    },
];

let appVersionGetter: any;

describe('getLinuxPackage', () => {
    beforeAll(() => {
        appVersionGetter = jest.spyOn(window.navigator, 'appVersion', 'get');
    });

    fixtures.forEach(f => {
        it(f.description, () => {
            appVersionGetter.mockReturnValue(f.appVersion);
            expect(getLinuxPackage()).toEqual(f.output);
        });
    });
});
