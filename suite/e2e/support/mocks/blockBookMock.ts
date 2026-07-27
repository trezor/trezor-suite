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
    private readonly newBlockSubscriptionIds = new Set<string>();

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
        // Remember block-subscription request ids: a pushed notification is only routed to the
        // client's `block` event when its id matches the id the subscription was created with.
        this.mockServer.on('blockbook_subscribeNewBlock', (request: { id: string }) => {
            this.newBlockSubscriptionIds.add(request.id);
        });
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

    @step()
    updateCurrentFiatRate(usdRate: number) {
        const currentFixtures = this.mockServer.getFixtures();
        const updatedFixtures = currentFixtures.map(fixture => {
            if (fixture.method !== 'getCurrentFiatRates') {
                return fixture;
            }

            return {
                method: 'getCurrentFiatRates',
                default: true,
                response: {
                    data: {
                        ts: 1752167345,
                        rates: {
                            usd: usdRate,
                        },
                    },
                },
            };
        });

        this.mockServer.setFixtures(updatedFixtures);
    }

    // Pushes a new-block notification to the subscribed clients — the same way a real blockbook
    // surfaces on-chain changes. Suite reacts with onBlockMinedThunk, which immediately re-fetches
    // all visible accounts on the network, so a preceding `updateAccountState` reaches Redux
    // without waiting for the periodic account sync (whose timer is not controlled by page.clock).
    @step()
    async sendNewBlockNotification({ height, hash }: { height: number; hash: string }) {
        if (this.newBlockSubscriptionIds.size === 0) {
            throw new Error('No subscribeNewBlock subscription has been captured yet');
        }

        const notifications = [...this.newBlockSubscriptionIds].map(id => ({
            id,
            data: { height, hash, evmData: null },
        }));

        await this.mockServer.sendNotification(notifications);
    }

    // Updates the `rpcCall` fixture used by ERC-20 allowance checks. `rawAmount` is the
    // token allowance in subunits (e.g. '10000000' for 10 USDC with 6 decimals), returned
    // ABI-encoded as a uint256.
    @step()
    updateAllowance(rawAmount: string) {
        const hexValue = BigInt(rawAmount).toString(16).padStart(64, '0');
        const currentFixtures = this.mockServer.getFixtures();
        const updatedFixtures = currentFixtures.map(fixture => {
            if (fixture.method !== 'rpcCall') {
                return fixture;
            }

            return {
                method: 'rpcCall',
                default: true,
                response: { data: { data: `0x${hexValue}` } },
            };
        });

        this.mockServer.setFixtures(updatedFixtures);
    }
}
