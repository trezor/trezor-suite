import { type TradingAvailability, getTradingAvailability } from './getTradingAvailability';

const AVAILABLE = {
    type: 'exchange',
    isDeviceCompromised: false,
    isDeviceCheckInconclusive: false,
    isTypeDisabled: false,
    isAllTradingDisabled: false,
} as const;

describe('getTradingAvailability', () => {
    it('is available when nothing blocks the trading type', () => {
        expect(getTradingAvailability(AVAILABLE)).toBe<TradingAvailability>('available');
    });

    it('reports a disabled type while other types remain available', () => {
        expect(
            getTradingAvailability({ ...AVAILABLE, isTypeDisabled: true }),
        ).toBe<TradingAvailability>('typeDisabled');
    });

    it('reports disabled trading instead of the single type when all types are disabled', () => {
        expect(
            getTradingAvailability({
                ...AVAILABLE,
                isTypeDisabled: true,
                isAllTradingDisabled: true,
            }),
        ).toBe<TradingAvailability>('allTradingDisabled');
    });

    it('keeps concierge available while all trading tabs are disabled', () => {
        expect(
            getTradingAvailability({
                ...AVAILABLE,
                type: 'concierge',
                isAllTradingDisabled: true,
            }),
        ).toBe<TradingAvailability>('available');
    });

    it('reports disabled concierge by its own flag only', () => {
        expect(
            getTradingAvailability({
                ...AVAILABLE,
                type: 'concierge',
                isTypeDisabled: true,
                isAllTradingDisabled: true,
            }),
        ).toBe<TradingAvailability>('typeDisabled');
    });

    it('puts a compromised device above any disabled state', () => {
        expect(
            getTradingAvailability({
                ...AVAILABLE,
                isDeviceCompromised: true,
                isTypeDisabled: true,
                isAllTradingDisabled: true,
            }),
        ).toBe<TradingAvailability>('deviceCompromised');
    });

    it('blocks the type without reporting a compromised device when a device check is inconclusive', () => {
        expect(
            getTradingAvailability({ ...AVAILABLE, isDeviceCheckInconclusive: true }),
        ).toBe<TradingAvailability>('typeDisabled');
    });

    it('reports disabled trading even when a device check is inconclusive', () => {
        expect(
            getTradingAvailability({
                ...AVAILABLE,
                isDeviceCheckInconclusive: true,
                isAllTradingDisabled: true,
            }),
        ).toBe<TradingAvailability>('allTradingDisabled');
    });
});
