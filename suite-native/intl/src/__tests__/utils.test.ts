import { deleteNestedTranslationKey, flatten, unflatten } from '../utils';

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

describe('unflatten', () => {
    it('should convert flat object with dot notation to nested object', () => {
        const input = {
            'navigation.tabs.home': 'Home',
            'navigation.tabs.accounts': 'My assets',
            'navigation.tabs.trade': 'Trade',
            'navigation.tabs.settings': 'Settings',
        };

        const expected = {
            navigation: {
                tabs: {
                    home: 'Home',
                    accounts: 'My assets',
                    trade: 'Trade',
                    settings: 'Settings',
                },
            },
        };

        expect(unflatten(input)).toEqual(expected);
    });

    it('should handle empty objects', () => {
        expect(unflatten({})).toEqual({});
    });

    it('should handle deeply nested objects', () => {
        const input = {
            'level1.level2.level3.level4.value': 'deep value',
        };

        const expected = {
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

        expect(unflatten(input)).toEqual(expected);
    });
});

describe('deleteNestedTranslationKey', () => {
    it('removes nested key and prunes empty parents', () => {
        const messages = {
            generic: {
                trezorSuite: 'Trezor Suite',
                buttons: {
                    yes: 'Yes',
                    no: 'No',
                },
            },
            moduleSend: {
                fees: {
                    custom: {
                        openButton: 'Open',
                    },
                },
                low: 'Low',
                normal: 'Normal',
                high: 'High',
            },
        };

        deleteNestedTranslationKey(messages, 'moduleSend.fees.custom.openButton');

        expect(messages).toEqual({
            generic: {
                trezorSuite: 'Trezor Suite',
                buttons: {
                    yes: 'Yes',
                    no: 'No',
                },
            },
            moduleSend: {
                low: 'Low',
                normal: 'Normal',
                high: 'High',
            },
        });
    });

    it('keeps parent when siblings still exist', () => {
        const messages = {
            moduleSend: {
                fees: {
                    custom: {
                        openButton: 'Open',
                        closeButton: 'Close',
                    },
                },
            },
        };

        deleteNestedTranslationKey(messages, 'moduleSend.fees.custom.openButton');

        expect(messages).toEqual({
            moduleSend: {
                fees: {
                    custom: {
                        closeButton: 'Close',
                    },
                },
            },
        });
    });

    it('removes entire branch when nothing remains', () => {
        const messages = {
            moduleSend: {
                fees: {
                    custom: {
                        openButton: 'Open',
                    },
                },
            },
        };

        deleteNestedTranslationKey(messages, 'moduleSend.fees.custom.openButton');

        expect(messages).toEqual({});
    });

    it('does nothing when path does not exist', () => {
        const messages = {
            moduleSend: {
                fees: {
                    custom: {
                        openButton: 'Open',
                    },
                },
            },
        };

        const clone = structuredClone(messages);

        deleteNestedTranslationKey(messages, 'moduleSend.fees.custom.invalid');

        expect(messages).toEqual(clone);
    });

    it('exits early when intermediate key missing', () => {
        const messages = {
            moduleSend: {
                fees: {},
            },
        };

        deleteNestedTranslationKey(messages, 'moduleSend.fees.custom.openButton');

        expect(messages).toEqual({
            moduleSend: {
                fees: {},
            },
        });
    });
});
