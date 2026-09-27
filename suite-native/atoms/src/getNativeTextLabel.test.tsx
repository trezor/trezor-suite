import { Text } from 'react-native';

import { type Translate, Translation, type TxKeyPath } from '@suite-native/intl';

import { getNativeTextLabel } from './getNativeTextLabel';

describe('getNativeTextLabel', () => {
    const translate: Translate = jest.fn((id: TxKeyPath) => id);

    it.each([
        { label: 'Standard', expected: 'Standard' },
        { label: 0, expected: '0' },
        { label: '', expected: '' },
    ])('keeps plain labels: $expected', ({ label, expected }) => {
        expect(getNativeTextLabel({ label, translate })).toBe(expected);
    });

    it('uses the current translator including the debug translation-key mode', () => {
        const label = <Translation id="transactionManagement.fees.tabs.standard" />;

        expect(getNativeTextLabel({ label, translate })).toBe(
            'transactionManagement.fees.tabs.standard',
        );
    });

    it('preserves interpolation values', () => {
        const values = { count: 3 };

        getNativeTextLabel({
            label: (
                <Translation
                    id="moduleAccountManagement.accountsScreen.networkFilter.accountCount"
                    values={values}
                />
            ),
            translate,
        });

        expect(translate).toHaveBeenLastCalledWith(
            'moduleAccountManagement.accountsScreen.networkFilter.accountCount',
            values,
        );
    });

    it('keeps rich translations and custom render functions in the fallback', () => {
        expect(
            getNativeTextLabel({
                label: (
                    <Translation
                        id="generic.buttons.continue"
                        values={{ content: <Text>Rich label</Text> }}
                    />
                ),
                translate,
            }),
        ).toBeNull();
        expect(
            getNativeTextLabel({
                label: (
                    <Translation id="generic.buttons.continue">
                        {chunks => <Text>{chunks}</Text>}
                    </Translation>
                ),
                translate,
            }),
        ).toBeNull();
    });

    it('keeps arbitrary React components in the fallback', () => {
        expect(getNativeTextLabel({ label: <Text>Custom label</Text>, translate })).toBeNull();
        expect(getNativeTextLabel({ label: null, translate })).toBeNull();
    });
});
