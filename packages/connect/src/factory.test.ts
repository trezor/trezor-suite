import { EventEmitter } from 'events';

import { factory } from './factory';
import { CONNECT_DEPRECATION_WARNING } from './utils/versionCheck';

describe(factory.name, () => {
    it('warns about the deprecation of Connect 9 on init', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const init = jest.fn().mockResolvedValue(undefined);
        const connect = factory({
            eventEmitter: new EventEmitter(),
            init,
            call: jest.fn(),
        } as never);

        await connect.init({
            manifest: {
                email: 'dev@example.com',
                appUrl: 'https://example.com',
                appName: 'Example',
            },
        });

        expect(warn).toHaveBeenCalledWith(CONNECT_DEPRECATION_WARNING);
        expect(init).toHaveBeenCalledTimes(1);
        warn.mockRestore();
    });
});
