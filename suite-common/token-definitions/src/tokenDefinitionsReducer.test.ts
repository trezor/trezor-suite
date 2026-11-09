import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { tokenDefinitionsActions } from './tokenDefinitionsActions';
import { prepareTokenDefinitionsReducer } from './tokenDefinitionsReducer';
import {
    DefinitionType,
    type TokenDefinitionsState,
    TokenManagementAction,
} from './tokenDefinitionsTypes';

const reducer = prepareTokenDefinitionsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadTokenManagement: mockReducer() },
});

describe('token visibility updates', () => {
    describe.each(['eth', 'base'])('%s', network => {
        const symbol = asNetworkSymbol(network);
        const contract = `0x${'aB'.repeat(20)}`;

        it.each([DefinitionType.COIN, DefinitionType.NFT])(
            'applies show → hide → show across persisted %s contract casing',
            type => {
                const originalState: TokenDefinitionsState = {
                    [symbol]: {
                        [type]: { error: false, isLoading: false, show: [contract], hide: [] },
                    },
                };
                const setStatus = (status: TokenManagementAction, contractAddress: string) =>
                    tokenDefinitionsActions.setTokenStatus({
                        symbol,
                        type,
                        contractAddress,
                        status,
                    });

                const hiddenState = reducer(
                    originalState,
                    setStatus(TokenManagementAction.HIDE, contract.toLowerCase()),
                );

                expect(hiddenState[symbol]?.[type]).toMatchObject({
                    show: [],
                    hide: [contract.toLowerCase()],
                });

                const shownState = reducer(
                    hiddenState,
                    setStatus(TokenManagementAction.SHOW, contract),
                );

                expect(shownState[symbol]?.[type]).toMatchObject({
                    show: [contract],
                    hide: [],
                });
                expect(
                    reducer(shownState, setStatus(TokenManagementAction.SHOW, contract)),
                ).toEqual(shownState);
                expect(originalState[symbol]?.[type]?.show).toEqual([contract]);
            },
        );
    });

    it.each([
        { network: 'ada', contract: 'policy.assetA', otherContract: 'policy.assetB' },
        { network: 'sol', contract: 'TokenMint', otherContract: 'tokenmint' },
    ])(
        'preserves distinct token identifiers on $network',
        ({ network, contract, otherContract }) => {
            const symbol = asNetworkSymbol(network);
            const originalState: TokenDefinitionsState = {
                [symbol]: {
                    coin: {
                        error: false,
                        isLoading: false,
                        show: [contract, otherContract],
                        hide: [],
                    },
                },
            };

            const state = reducer(
                originalState,
                tokenDefinitionsActions.setTokenStatus({
                    symbol,
                    type: DefinitionType.COIN,
                    contractAddress: contract,
                    status: TokenManagementAction.HIDE,
                }),
            );

            expect(state[symbol]?.coin).toMatchObject({ show: [otherContract], hide: [contract] });
        },
    );
});
