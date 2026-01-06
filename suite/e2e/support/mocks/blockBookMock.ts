import { BackendWebsocketServerMock } from '@trezor/e2e-utils';
import { BackendType } from '@trezor/e2e-utils/src/mocks/backendServer';

import { step } from '../common';
import {
    ADA_MOCKED_ACCOUNT,
    ADA_MOCKED_EMPTY_ACCOUNT,
    fixtures as adaFixtures,
} from './ada-endpoints';
import { fixtures as dogeFixtures } from './doge-endpoints';
import { ETH_MOCKED_ACCOUNT, fixtures as ethFixtures } from './eth-endpoints';
import { fixtures as ltcFixtures } from './ltc-mw-endpoints';

type SupportedSymbols = 'ltc' | 'doge' | 'eth' | 'ada';

export class BlockbookMock {
    private _mockServer: BackendWebsocketServerMock | undefined;
    private accountState: any = null;
    private mockType: SupportedSymbols | null = null;

    get mockServer() {
        if (!this._mockServer) {
            throw new Error('Blockbook mock not initialized');
        }

        return this._mockServer;
    }

    get url() {
        return `ws://localhost:${this.mockServer.options.port}`;
    }

    private selectFixture(type: SupportedSymbols) {
        switch (type) {
            case 'ltc':
                return ltcFixtures;
            case 'doge':
                return dogeFixtures;
            case 'eth':
                this.accountState = ETH_MOCKED_ACCOUNT;

                return ethFixtures;
            case 'ada':
                this.accountState = ADA_MOCKED_ACCOUNT;

                return adaFixtures;
            default:
                throw new Error('Unknown blockbook mock type');
        }
    }

    @step()
    async start(mockType: SupportedSymbols, serverType: BackendType = 'blockbook') {
        this._mockServer = await BackendWebsocketServerMock.create(serverType);
        this.mockType = mockType;
        const fixtures = this.selectFixture(mockType);
        this.mockServer.setFixtures(fixtures);
    }

    @step()
    stop() {
        if (this._mockServer) {
            this._mockServer.stop();
        }
    }

    @step()
    updateAccountState(accountData: any) {
        if (this.mockType !== 'eth' && this.mockType !== 'ada') {
            throw new Error(
                `Account state update not supported for this mock type: ${this.mockType}`,
            );
        }

        const accountParams = {
            eth: {
                accountMethod: 'getAccountInfo',
                accountId: 'address',
                fallbackResponse: undefined,
            },

            ada: {
                accountMethod: 'GET_ACCOUNT_INFO',
                accountId: 'descriptor',
                fallbackResponse: ADA_MOCKED_EMPTY_ACCOUNT,
            },
        };
        const { accountMethod, accountId, fallbackResponse } = accountParams[this.mockType];

        this.accountState = { ...this.accountState, ...accountData };
        const currentFixture = this.mockServer.getFixtures();
        const updatedFixtures = currentFixture.map(fixture => {
            if (fixture.method !== accountMethod) {
                return fixture;
            }

            return {
                method: accountMethod,
                default: true,
                response: ({ params }: any) => {
                    if (params.descriptor === this.accountState[accountId]) {
                        return { data: this.accountState };
                    } else if (fallbackResponse) {
                        return { data: fallbackResponse };
                    }
                },
            };
        });

        this.mockServer.setFixtures(updatedFixtures);
    }
}
