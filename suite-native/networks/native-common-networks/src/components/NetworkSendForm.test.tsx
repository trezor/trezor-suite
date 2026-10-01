import { Text, TextInput } from 'react-native';

import { combineReducers } from '@reduxjs/toolkit';

import { asNetworkSymbol } from '@suite-common/networks';
import type {
    NativeNetworkSendModule,
    NativeSendFeeSelectorProps,
    NativeSendFieldProps,
} from '@suite-native/network-module-suite-native-types';
import {
    createLightStore,
    createStaticReducer,
    fireEvent,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils-store';

import type { NativeNetworksServices } from '../NativeNetworksServices';
import { sendFormReducer } from '../sendFormSlice';
import { NetworkSendForm } from './NetworkSendForm';

const tagged = asNetworkSymbol('tagged');
const fixed = asNetworkSymbol('fixed');
const unsupported = asNetworkSymbol('zzz');

// Stand-ins for a network's slot components: they render what they receive and nothing else.
const TagField = ({ value, onChange, error }: NativeSendFieldProps) => (
    <>
        <TextInput testID="tag" value={value} onChangeText={onChange} />
        {error && <Text testID="tag-error">{error}</Text>}
    </>
);

const FeeSelector = ({ levels, selectedLevelId, onSelect }: NativeSendFeeSelectorProps) => (
    <>
        <Text testID="selected-fee">{selectedLevelId}</Text>
        {levels.map(level => (
            <Text key={level.id} testID={`fee-${level.id}`} onPress={() => onSelect(level.id)}>
                {level.value}
            </Text>
        ))}
    </>
);

const taggedSend: NativeNetworkSendModule = {
    fee: { model: 'per-transaction', unit: 'drops', selectable: true },
    strategy: {
        getFeeLevels: () => [
            { id: 'normal', value: '12' },
            { id: 'high', value: '24' },
        ],
    },
    fields: [{ declaration: { id: 'tag', kind: 'uint32' }, component: TagField }],
    feeSelector: FeeSelector,
};

const fixedSend: NativeNetworkSendModule = {
    fee: { model: 'per-transaction', unit: 'drops', selectable: false },
    strategy: { getFeeLevels: () => [{ id: 'normal', value: '12' }] },
    fields: [],
};

const nativeNetworks: NativeNetworksServices = {
    getSend: networkSymbol =>
        ({ [tagged]: taggedSend, [fixed]: fixedSend })[networkSymbol as string],
    getAccountDetailBanners: () => [],
};

// Only the slice under test is live, under the key the app uses; the rest is what the test
// providers read.
const createStore = () =>
    createLightStore({
        reducer: {
            nativeNetworks: combineReducers({ sendForm: sendFormReducer }),
            discreetMode: createStaticReducer({ isActive: false }),
            wallet: createStaticReducer({
                settings: {
                    localCurrency: 'usd',
                    bitcoinAmountUnit: 0,
                    addressDisplayType: 'chunked',
                },
            }),
            locale: createStaticReducer({ systemLocaleCode: 'en', appLocaleCode: 'system' }),
        },
    });

const renderForm = async (networkSymbol: string) =>
    await renderWithStoreProvider(
        <NetworkSendForm networkSymbol={asNetworkSymbol(networkSymbol)} />,
        { services: { nativeNetworks, store: createStore() } },
    );

describe('NetworkSendForm', () => {
    it('renders nothing but the layout for a network without a send module', async () => {
        await renderForm(unsupported);

        expect(screen.queryByLabelText('Recipient address')).toBeNull();
    });

    it('renders the declared field and validates it with the declared rule', async () => {
        await renderForm(tagged);

        expect(screen.queryByTestId('tag-error')).toBeNull();

        await fireEvent.changeText(screen.getByTestId('tag'), '12x');

        expect(screen.getByTestId('tag')).toHaveProp('value', '12x');
        expect(screen.getByTestId('tag-error')).toHaveTextContent('not-a-number');
    });

    it('defaults to the first fee level and stores the selected one', async () => {
        await renderForm(tagged);

        expect(screen.getByTestId('selected-fee')).toHaveTextContent('normal');

        await fireEvent.press(screen.getByTestId('fee-high'));

        expect(screen.getByTestId('selected-fee')).toHaveTextContent('high');
    });

    it('renders no fee selector for a fixed fee', async () => {
        await renderForm(fixed);

        expect(screen.getByLabelText('Recipient address')).toBeTruthy();
        expect(screen.queryByTestId('selected-fee')).toBeNull();
    });

    it('keeps the draft across remounts and apart from other networks', async () => {
        const { rerender } = await renderForm(tagged);

        await fireEvent.changeText(screen.getByLabelText('Recipient address'), 'rAddress');
        await fireEvent.changeText(screen.getByTestId('tag'), '42');

        // Keys force a fresh mount, so only the store can carry the draft over.
        await rerender(<NetworkSendForm key="fixed" networkSymbol={fixed} />);
        expect(screen.getByLabelText('Recipient address')).toHaveProp('value', '');

        await rerender(<NetworkSendForm key="tagged-again" networkSymbol={tagged} />);
        expect(screen.getByLabelText('Recipient address')).toHaveProp('value', 'rAddress');
        expect(screen.getByTestId('tag')).toHaveProp('value', '42');
    });
});
