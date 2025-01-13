import { BackendWebsocketServerMock } from '@trezor/e2e-utils';

import { step } from '../common';
import { fixtures as dogeFixtures } from './doge-endpoints';
import { fixtures as ltcFixtures } from './ltc-mimble-wimble-endpoints';

export class BlockbookMock {
    private mockServer: BackendWebsocketServerMock | undefined;

    get url() {
        if (!this.mockServer) {
            throw new Error('Blockbook mock not initialized');
        }

        return `ws://localhost:${this.mockServer.options.port}`;
    }

    @step()
    async start(type: 'ltc' | 'doge') {
        this.mockServer = await BackendWebsocketServerMock.create('blockbook');
        const fixtures = type === 'ltc' ? ltcFixtures : dogeFixtures;
        this.mockServer.setFixtures(fixtures);
    }

    @step()
    stop() {
        if (this.mockServer) {
            this.mockServer.stop();
        }
    }
}
