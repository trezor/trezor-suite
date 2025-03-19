import { ButtonRequest } from '@suite-common/suite-types';

import { usePinWithoutSelector } from '../usePinModal';

describe('usePinWithoutSelector', () => {
    it('handle new pin request', () => {
        const buttonRequests: Pick<ButtonRequest, 'code'>[] = [
            { code: 'PinMatrixRequestType_Current' },
            { code: 'PinMatrixRequestType_NewFirst' },
        ];
        const { isWipeCode, isRequestingNewPinCode, isPinInvalid } =
            usePinWithoutSelector(buttonRequests);
        expect(isWipeCode).toBe(false);
        expect(isRequestingNewPinCode).toBe(true);
        expect(isPinInvalid).toBe(false);
    });
    it('handle invalid pin request', () => {
        const buttonRequests: Pick<ButtonRequest, 'code'>[] = [
            { code: 'ui-invalid_pin' },
            { code: 'PinMatrixRequestType_Current' },
        ];
        const { isWipeCode, isRequestingNewPinCode, isPinInvalid } =
            usePinWithoutSelector(buttonRequests);
        expect(isWipeCode).toBe(false);
        expect(isRequestingNewPinCode).toBe(false);
        expect(isPinInvalid).toBe(true);
    });
    it('handle new wipe-code request', () => {
        const buttonRequests: Pick<ButtonRequest, 'code'>[] = [
            { code: 'PinMatrixRequestType_Current' },
            { code: 'PinMatrixRequestType_WipeCodeFirst' },
        ];
        const { isWipeCode, isRequestingNewPinCode, isPinInvalid } =
            usePinWithoutSelector(buttonRequests);
        expect(isWipeCode).toBe(true);
        expect(isRequestingNewPinCode).toBe(false);
        expect(isPinInvalid).toBe(false);
    });
});
