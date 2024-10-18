import TrezorConnect from '../../../src';
import { getController, initTrezorConnect } from '../../common.setup';

describe('__info common param', () => {
    beforeAll(async () => {
        await TrezorConnect.dispose();

        await initTrezorConnect(getController());
    });

    afterAll(async () => {
        await TrezorConnect.dispose();
    });

    it('common param __info - only method info is returned', async () => {
        const result = await TrezorConnect.getFeatures({
            __info: true,
        });
        if (!result.success) throw new Error(result.payload.error);
        // @ts-expect-error todo: types not finished
        expect(result.payload.useDevice).toEqual(true);
        expect(result.payload.minor_version).toEqual(undefined);
    });
});
