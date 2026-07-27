import { normalizeEvents } from '../normalizeEvents';

describe('normalizeEvents', () => {
    it('keeps event.changelog.entries event-scoped (attributes do not leak into entries)', () => {
        const input = [
            {
                name: 'accounts/active-staking',
                descriptionTrigger: 'trigger',
                description: 'desc',
                changelog: [{ version: '1.0.0', notes: 'event note' }],
                attributes: {
                    someAttribute: {
                        description: 'attr desc',
                        changelog: [{ version: '2.0.0', notes: 'attribute note' }],
                    },
                },
                platform: 'desktop',
            },
        ] as any;

        const eventDoc = normalizeEvents(input)[input[0].name];

        expect(eventDoc?.changelog.entries.map(e => e.version)).toEqual(['1.0.0']);
        expect(eventDoc?.changelog.addedInVersion).toBe('1.0.0');
        expect(eventDoc?.changelog.lastUpdatedInVersion).toBe('2.0.0');
    });

    it('does not affect addedInVersion with attribute unknown versions ("?")', () => {
        const input = [
            {
                name: 'accounts/active-staking',
                descriptionTrigger: 'trigger',
                description: 'desc',
                changelog: [{ version: '1.0.0', notes: 'event note' }],
                attributes: {
                    someAttribute: {
                        description: 'attr desc',
                        changelog: [{ version: '?', notes: 'unknown attribute note' }],
                    },
                },
                platform: 'desktop',
            },
        ] as any;

        const eventDoc = normalizeEvents(input)[input[0].name];

        expect(eventDoc?.changelog.entries.map(e => e.version)).toEqual(['1.0.0']);
        expect(eventDoc?.changelog.addedInVersion).toBe('1.0.0');
        expect(eventDoc?.changelog.lastUpdatedInVersion).toBeUndefined();
    });
});
