import * as fixtures from './__fixtures__/messageSystemValidation';
import * as messageSystem from './messageSystemValidation';

describe('Message system validation', () => {
    describe('stripFieldFromMessage', () => {
        fixtures.stripFieldFromMessage.forEach(f => {
            it(f.description, () => {
                expect(messageSystem.stripFieldFromMessage(f.input)).toEqual(f.result);
            });
        });
    });

    describe('validateRuntimeEvmNetworksPayload', () => {
        it('accepts a list of network entries, checked one by one later', () => {
            const payload = { networks: [{ symbol: 'abc', chainId: 777 }, { anything: true }] };

            expect(messageSystem.validateRuntimeEvmNetworksPayload(payload)).toEqual(payload);
        });

        it.each([{}, { networks: 'abc' }, { networks: ['abc'] }])('refuses %j', payload => {
            expect(() => messageSystem.validateRuntimeEvmNetworksPayload(payload)).toThrow();
        });
    });

    describe('validateMessageForm', () => {
        const action = (payload: unknown) => ({
            message: {
                id: 'runtime-evm',
                priority: 1,
                dismissible: false,
                variant: 'info',
                category: 'feature',
                content: {
                    'en-GB': '',
                    en: '',
                    es: '',
                    cs: '',
                    ru: '',
                    ja: '',
                    hu: '',
                    it: '',
                    fr: '',
                    de: '',
                    pt: '',
                },
                feature: [{ domain: 'networks.evm.runtime', flag: true, payload }],
            },
            conditions: [],
        });

        it('checks the runtime EVM networks payload of its feature', () => {
            expect(() =>
                messageSystem.validateMessageForm(action({ networks: [{ symbol: 'abc' }] })),
            ).not.toThrow();
            expect(() => messageSystem.validateMessageForm(action({ list: [] }))).toThrow();
        });
    });
});
