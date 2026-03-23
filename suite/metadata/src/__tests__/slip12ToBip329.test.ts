import { type AccountLabels } from '@suite-common/metadata-types';

import { slip15ToBip329 } from '../slip15ToBip329';

describe(slip15ToBip329.name, () => {
    it('transform properly', () => {
        const slip15Example: AccountLabels = {
            accountLabel: 'The first segwit account from all seed',
            outputLabels: {
                '50e4fa9ebfca7d510feae7226a7d5d046114f54a7918cdd83e40c98d70d17e4d': {
                    '0': 'this is expending transaction output or just tx',
                },
                '519e17d6f3eb87cc8c4bf450d0dc2bad83a1387713680bec609bcb5d8e53335e': {
                    '0': 'this is receive tx label',
                },
            },
            addressLabels: {
                bc1qq46pg2kafgjvsh7me3puv0jujdl77a5829xlrs: 'This address is labeled',
            },
        };

        const bip329Output = slip15ToBip329(slip15Example);

        const expectedResult = [
            {
                type: 'output',
                ref: '50e4fa9ebfca7d510feae7226a7d5d046114f54a7918cdd83e40c98d70d17e4d:0',
                label: 'this is expending transaction output or just tx',
            },
            {
                type: 'output',
                ref: '519e17d6f3eb87cc8c4bf450d0dc2bad83a1387713680bec609bcb5d8e53335e:0',
                label: 'this is receive tx label',
            },
            {
                type: 'addr',
                ref: 'bc1qq46pg2kafgjvsh7me3puv0jujdl77a5829xlrs',
                label: 'This address is labeled',
            },
        ];

        bip329Output.forEach((label, index) => {
            expect(label.type).toEqual(expectedResult[index].type);
            expect(label.ref).toEqual(expectedResult[index].ref);
            expect(label.label).toEqual(expectedResult[index].label);
        });
    });
});
