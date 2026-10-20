import { Feature as FeatureDefinitions } from '@suite-common/message-system';
import { type Feature } from '@suite-common/suite-types';

import { getFinpromRestrictedCountries } from './finpromPayload';

const createFinpromFeature = (payload?: Feature['payload']): Feature => ({
    domain: FeatureDefinitions.finprom.presenceRestriction,
    flag: true,
    payload,
});

describe(getFinpromRestrictedCountries.name, () => {
    it.each([
        ['undefined feature', undefined, []],
        ['feature without payload', createFinpromFeature(), []],
        ['countries not an array', createFinpromFeature({ countries: 'GB' }), []],
        ['empty countries', createFinpromFeature({ countries: [] }), []],
        [
            'non-string entries',
            createFinpromFeature({ countries: ['GB', 1, null, {}, 'CZ'] }),
            ['GB', 'CZ'],
        ],
        [
            'differently cased countries',
            createFinpromFeature({ countries: ['gb', 'Cz', 'sK'] }),
            ['GB', 'CZ', 'SK'],
        ],
        [
            'unknown and special codes',
            createFinpromFeature({ countries: ['GB', 'ZZ', 'T1', 'XX', 'GBR', ''] }),
            ['GB'],
        ],
    ] as const satisfies [string, Feature | undefined, readonly string[]][])(
        'returns countries for %s',
        (_description, feature, expected) => {
            expect(getFinpromRestrictedCountries(feature)).toEqual(expected);
        },
    );
});
