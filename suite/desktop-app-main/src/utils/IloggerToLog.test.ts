import { convertILoggerToLog } from './IloggerToLog';

const createILoggerMock = () =>
    ({
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        level: 'debug',
    }) as unknown as ILogger & { debug: jest.Mock; error: jest.Mock };

describe('convertILoggerToLog', () => {
    it('joins multiple arguments and passes strings through', () => {
        const iLogger = createILoggerMock();
        convertILoggerToLog(iLogger, { serviceName: 'svc' }).debug('Sending', 'GetAddress');

        expect(iLogger.debug).toHaveBeenCalledWith('svc', 'Sending GetAddress');
    });

    it('keeps the keys of object arguments while redacting their values', () => {
        const iLogger = createILoggerMock();
        convertILoggerToLog(iLogger, { serviceName: 'svc' }).debug('Sending', {
            address_n: [44, 0],
            coin: 'btc',
        });

        expect(iLogger.debug).toHaveBeenCalledWith(
            'svc',
            'Sending {"address_n":["(number redacted...)","(number redacted...)"],"coin":"(string redacted...)"}',
        );
    });

    it('keeps the text of an Error argument, at the root and when nested', () => {
        const iLogger = createILoggerMock();
        const log = convertILoggerToLog(iLogger, { serviceName: 'svc' });

        log.error('onCall', new Error('device disconnected'));
        expect(iLogger.error.mock.calls[0][1]).toContain('Error: device disconnected');

        log.error('onCall', { cause: new Error('device disconnected') });
        expect(iLogger.error.mock.calls[1][1]).toBe(
            'onCall {"cause":"Error: device disconnected"}',
        );
    });

    it('does not throw on circular references', () => {
        const iLogger = createILoggerMock();
        const circular: Record<string, unknown> = {};
        circular.self = circular;

        expect(() =>
            convertILoggerToLog(iLogger, { serviceName: 'svc' }).debug('device', circular),
        ).not.toThrow();
    });
});
