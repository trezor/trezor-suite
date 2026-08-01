import { asProtocol } from '@trezor/network-module-suite-common-types';

import { fillSendForm } from 'src/actions/suite/protocolActions';
import type { Action } from 'src/types/suite';

import fixtures from './__fixtures__/protocolReducer';
import protocolReducer, { type ProtocolState } from './protocolReducer';

type FillSendFormCase = {
    description: string;
    sendForm: ProtocolState['sendForm'];
};

const fillSendFormCases: FillSendFormCase[] = [
    {
        description: 'address and amount',
        sendForm: {
            scheme: asProtocol('bitcoin'),
            address: '12345abcde',
            amount: '1.02',
            shouldFill: false,
        },
    },
    {
        description: 'address',
        sendForm: {
            scheme: asProtocol('bitcoin'),
            address: '12345abcde',
            shouldFill: false,
        },
    },
];

describe('Protocol reducer', () => {
    it.each(fillSendFormCases)('fills a send form with $description', ({ sendForm }) => {
        const filledState = protocolReducer({ sendForm }, fillSendForm(true));

        expect(filledState.sendForm).toEqual({
            ...sendForm,
            shouldFill: true,
        });

        const clearedState = protocolReducer(filledState, fillSendForm(false));

        expect(clearedState.sendForm).toEqual({
            ...sendForm,
            shouldFill: false,
        });
    });

    fixtures.forEach(f => {
        it(f.description, () => {
            let state: ProtocolState = f.initialState as ProtocolState;
            f.actions.forEach(a => {
                state = protocolReducer(state, a as Action);
            });
            expect(state).toEqual(f.result);
        });
    });
});
