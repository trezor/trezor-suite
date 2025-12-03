import { BackendWebsocketServerMock } from '@trezor/e2e-utils';

import { step } from '../common';
import { fixtures as dogeFixtures } from './doge-endpoints';
import { ETH_ACC, fixtures as ethFixtures } from './eth-endpoints';
import { fixtures as ltcFixtures } from './ltc-mw-endpoints';

export class BlockbookMock {
    private mockServer: BackendWebsocketServerMock | undefined;
    private accountState: any = null;

    get url() {
        if (!this.mockServer) {
            throw new Error('Blockbook mock not initialized');
        }

        return `ws://localhost:${this.mockServer.options.port}`;
    }

    private selectFixture(type: 'ltc' | 'doge' | 'eth') {
        switch (type) {
            case 'ltc':
                return ltcFixtures;
            case 'doge':
                return dogeFixtures;
            case 'eth':
                this.accountState = ETH_ACC;

                return ethFixtures;
            default:
                throw new Error('Unknown blockbook mock type');
        }
    }

    @step()
    async start(type: 'ltc' | 'doge' | 'eth') {
        this.mockServer = await BackendWebsocketServerMock.create('blockbook');
        const fixtures = this.selectFixture(type);
        this.mockServer.setFixtures(fixtures);
    }

    @step()
    stop() {
        if (this.mockServer) {
            this.mockServer.stop();
        }
    }

    @step()
    updateAccountState(accountData: any) {
        if (!this.mockServer) {
            throw new Error('Blockbook mock not initialized');
        }

        this.accountState = { ...this.accountState, ...accountData };
        const currentFixture = this.mockServer.getFixtures();
        if (!currentFixture) {
            throw new Error('No fixtures found in Blockbook mock');
        }

        const updatedFixtures = currentFixture.map(fixture => {
            if (fixture.method === 'getAccountInfo') {
                return {
                    method: 'getAccountInfo',
                    default: true,
                    response: ({ params }: any) => {
                        if (params.descriptor === this.accountState.address) {
                            return { data: this.accountState };
                        }
                    },
                };
            }

            return fixture;
        });

        this.mockServer.setFixtures(updatedFixtures);
    }
}
