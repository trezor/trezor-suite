import TrezorConnect, { UI_RESPONSE, uiResponse } from '../index';

describe('uiResponse', () => {
    it('forwards the response to the privileged Connect instance', () => {
        const response = {
            type: UI_RESPONSE.RECEIVE_WORD,
            payload: 'abandon',
        } as const;
        const uiResponseSpy = jest.spyOn(TrezorConnect, 'uiResponse').mockImplementation();

        uiResponse(response);

        expect(uiResponseSpy).toHaveBeenCalledWith(response);
    });
});
