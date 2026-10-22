import { validateAnalyticsEventName } from './eventNameValidation';

describe('Earn analytics event names', () => {
    it.each(['earn/tile-pressed', 'earn/dashboard-ready'])('accepts the shared event %s', name =>
        expect(validateAnalyticsEventName(name)).toBeNull(),
    );

    it('still rejects non-kebab-case Earn events', () => {
        expect(validateAnalyticsEventName('earn/dashboard_ready')).toEqual({
            messageId: 'notKebabCase',
            data: { eventPart: 'earn/dashboard_ready' },
        });
    });

    it('does not permit other unregistered domains', () => {
        expect(validateAnalyticsEventName('earning/dashboard-ready')).toEqual({
            messageId: 'invalidDomain',
            data: { domain: 'earning' },
        });
    });
});
