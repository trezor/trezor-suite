import { toGetter } from '../toGetter';

type TestState = {
    relayUrl: string;
    selectedWalletDescriptor: string;
};

const state: TestState = {
    relayUrl: 'wss://relay.example.com',
    selectedWalletDescriptor: 'wallet-1',
};

const getState = () => state;

describe(toGetter.name, () => {
    it('creates a getter for selectors without extra params', () => {
        const getRelayUrl = toGetter(getState, currentState => currentState.relayUrl);

        expect(getRelayUrl()).toBe('wss://relay.example.com');
    });

    it('creates a getter for selectors with one extra param', () => {
        type GetIsSelectedWallet = (walletDescriptor: string) => boolean;

        const isSelectedWallet: GetIsSelectedWallet = toGetter(
            getState,
            (currentState: TestState, walletDescriptor: string) =>
                currentState.selectedWalletDescriptor === walletDescriptor,
        );

        expect(isSelectedWallet('wallet-1')).toBe(true);
        expect(isSelectedWallet('wallet-2')).toBe(false);
    });

    it('forwards multiple selector params', () => {
        type GetRelayLabel = (walletDescriptor: string, suffix: number) => string;

        const getRelayLabel: GetRelayLabel = toGetter(
            getState,
            (currentState: TestState, label: string, suffix: number) =>
                `${label}:${currentState.relayUrl}:${suffix}`,
        );

        expect(getRelayLabel('relay', 2)).toBe('relay:wss://relay.example.com:2');
    });
});
