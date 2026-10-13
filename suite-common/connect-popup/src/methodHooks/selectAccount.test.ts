import { connectPopupActions } from '../connectPopupActions';
import { selectAccountHooks } from './selectAccount';

// `buildOptions` is module-local, so the normalized options are read off the action the hook
// dispatches. The hook dispatches synchronously and only then blocks on the permission deferred
// (which the resolve thunk would settle), so the returned promise is deliberately left pending.
const optionsFor = (payload: Record<string, unknown>) => {
    const dispatch = jest.fn();

    void selectAccountHooks.postCallHook({
        method: 'selectAccount',
        originalPayload: payload,
        response: { success: true },
        dispatch,
    } as any);

    const [action] = dispatch.mock.calls[0];
    expect(action.type).toBe(connectPopupActions.selectAccount.type);

    return action.payload.options;
};

describe('selectAccount postCallHook options', () => {
    describe('requireOnDeviceVerification', () => {
        it.each([
            // omitted: the per-flow default — an address is confirmed on the device, an xpub is not
            [{ coin: 'eth' }, true],
            [{ coin: 'btc' }, false],
            [{ coin: 'ada' }, false],
            [{ coin: 'btc', addressSelection: 'firstFresh' }, true],
            [{ coin: 'btc', addressSelection: 'manual' }, true],
            // explicit: always wins over the default, both ways
            [{ coin: 'btc', requireOnDeviceVerification: true }, true],
            [{ coin: 'eth', requireOnDeviceVerification: false }, false],
        ])('%j -> %s', (payload, expected) => {
            expect(optionsFor(payload).requireOnDeviceVerification).toBe(expected);
        });
    });

    it('normalizes addressSelection for UTXO networks and ignores it elsewhere', () => {
        expect(optionsFor({ coin: 'btc' })).toMatchObject({
            addressSelection: 'fullAccount',
            mode: 'xpub',
        });
        expect(optionsFor({ coin: 'btc', addressSelection: 'firstFresh' })).toMatchObject({
            addressSelection: 'firstFresh',
            mode: 'address',
        });
        expect(optionsFor({ coin: 'eth', addressSelection: 'fullAccount' })).toMatchObject({
            addressSelection: undefined,
            mode: 'address',
        });
    });
});
