import { flatten } from '../utils';

describe('flatten', () => {
    it('should flatten nested translation object to dot notation', () => {
        const input = {
            navigation: {
                tabs: {
                    home: 'Home',
                    accounts: 'My assets',
                    trade: 'Trade',
                    settings: 'Settings',
                },
            },
        };

        const expected = {
            'navigation.tabs.home': 'Home',
            'navigation.tabs.accounts': 'My assets',
            'navigation.tabs.trade': 'Trade',
            'navigation.tabs.settings': 'Settings',
        };

        expect(flatten(input)).toEqual(expected);
    });

    it('should handle empty objects', () => {
        expect(flatten({})).toEqual({});
    });

    it('should handle deeply nested objects', () => {
        const input = {
            level1: {
                level2: {
                    level3: {
                        level4: {
                            value: 'deep value',
                        },
                    },
                },
            },
        };
        const expected = {
            'level1.level2.level3.level4.value': 'deep value',
        };
        expect(flatten(input)).toEqual(expected);
    });

    it('should handle multiple branches at the same level', () => {
        const input = {
            section1: {
                key1: 'value1',
                key2: 'value2',
            },
            section2: {
                key3: 'value3',
                key4: 'value4',
            },
        };
        const expected = {
            'section1.key1': 'value1',
            'section1.key2': 'value2',
            'section2.key3': 'value3',
            'section2.key4': 'value4',
        };
        expect(flatten(input)).toEqual(expected);
    });
});
