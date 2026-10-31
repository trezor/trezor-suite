import { deviceInitialState } from '@suite-common/device';
import {
    messageSystemInitialState,
    selectActiveExperimentsWithVariants,
} from '@suite-common/message-system';
import { closeHomeAssetTableFeedback } from '@suite-common/wallet-core';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import {
    type SendHomeAssetTableFeedbackThunkState,
    sendHomeAssetTableFeedbackThunk,
} from './homeAssetTableFeedbackThunks';

jest.mock('@suite-common/feedback', () => ({
    ...jest.requireActual('@suite-common/feedback'),
    buildUserFeedbackData: jest.fn(() => ({ platform: 'mobile' })),
}));

jest.mock('@suite-common/message-system', () => ({
    ...jest.requireActual('@suite-common/message-system'),
    selectActiveExperimentsWithVariants: jest.fn(),
}));

const state: SendHomeAssetTableFeedbackThunkState = {
    analytics: {},
    device: deviceInitialState,
    messageSystem: messageSystemInitialState,
};

const sendFeedback = async () => {
    const getState = () => state;
    const extra = {};
    const { actions, dispatch } = createMockDispatch({ getState, extra });

    await sendHomeAssetTableFeedbackThunk({ rating: '4', description: 'Nice table' })(
        dispatch,
        getState,
        extra,
    );

    return actions;
};

describe('sendHomeAssetTableFeedbackThunk', () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    beforeEach(() => {
        fetchSpy.mockResolvedValue(new Response());
        jest.mocked(selectActiveExperimentsWithVariants).mockReturnValue([
            { name: 'assetFirstHomeTable', variant: 'B' },
        ]);
    });

    afterAll(() => {
        fetchSpy.mockRestore();
    });

    it('sends a dashboard suggestion tagged with the table and the active experiment variants', async () => {
        await sendFeedback();

        const [url] = fetchSpy.mock.calls[0] ?? [];
        const params = new URL(String(url)).searchParams;

        expect(Object.fromEntries(params)).toEqual(
            expect.objectContaining({
                category: 'dashboard',
                context: 'homeAssetTable',
                feature: 'homeAssetTable',
                rating: '4',
                description: 'Nice table',
                activeExperimentsWithVariants: 'assetFirstHomeTable:B',
                platform: 'mobile',
            }),
        );
    });

    it('remembers the feedback was sent, so the form does not come back', async () => {
        const actions = await sendFeedback();

        expect(actions).toContainEqual(closeHomeAssetTableFeedback());
    });

    it('keeps the form when sending fails, so the feedback can be sent again', async () => {
        fetchSpy.mockRejectedValue(new Error('offline'));

        const actions = await sendFeedback();

        expect(actions).not.toContainEqual(closeHomeAssetTableFeedback());
    });
});
