import { isEarnSigningCancelled } from './earnTransactionAnalytics';

describe('isEarnSigningCancelled', () => {
    it.each(['Failure_ActionCancelled', 'Failure_PinCancelled', 'Method_Cancel'])(
        'recognizes intentional cancellation %s',
        code => expect(isEarnSigningCancelled({ code, message: 'cancelled' })).toBe(true),
    );

    it('recognizes the application cancellation marker', () => {
        expect(isEarnSigningCancelled({ message: 'tx-cancelled' })).toBe(true);
    });

    it.each(['tx-timeout', 'Device disconnected', 'tx-cancelled by remote server'])(
        'does not classify %s as a user cancellation',
        message =>
            expect(isEarnSigningCancelled({ code: 'Failure_FirmwareError', message })).toBe(false),
    );

    it('does not count a timeout carrying Method_Cancel as user cancellation', () => {
        expect(isEarnSigningCancelled({ code: 'Method_Cancel', message: 'tx-timeout' })).toBe(
            false,
        );
    });
});
