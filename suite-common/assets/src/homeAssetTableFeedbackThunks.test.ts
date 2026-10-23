import { sendFeedbackThunk } from '@suite-common/feedback';
import { selectActiveExperimentsWithVariants } from '@suite-common/message-system';

import { sendHomeAssetTableFeedbackThunk } from './homeAssetTableFeedbackThunks';

jest.mock('@suite-common/feedback', () => ({
    ...jest.requireActual('@suite-common/feedback'),
    sendFeedbackThunk: jest.fn(() => ({ type: 'sendFeedback' })),
    buildUserFeedbackData: jest.fn(() => ({ platform: 'mobile' })),
}));

jest.mock('@suite-common/message-system', () => ({
    ...jest.requireActual('@suite-common/message-system'),
    selectActiveExperimentsWithVariants: jest.fn(),
}));

describe('sendHomeAssetTableFeedbackThunk', () => {
    it('sends a dashboard suggestion tagged with the table and the active experiment variants', async () => {
        jest.mocked(selectActiveExperimentsWithVariants).mockReturnValue([
            { name: 'assetFirstHomeTable', variant: 'B' },
        ]);
        const dispatch = jest.fn();
        const getState = () => ({ device: { selectedDevice: undefined } });

        await sendHomeAssetTableFeedbackThunk({ rating: '4', description: 'Nice table' })(
            dispatch,
            getState as any,
            {},
        );

        expect(sendFeedbackThunk).toHaveBeenCalledWith({
            type: 'SUGGESTION',
            payload: expect.objectContaining({
                category: 'dashboard',
                context: 'homeAssetTable',
                feature: 'homeAssetTable',
                rating: '4',
                description: 'Nice table',
                activeExperimentsWithVariants: ['assetFirstHomeTable:B'],
                platform: 'mobile',
            }),
        });
        expect(dispatch).toHaveBeenCalledWith({ type: 'sendFeedback' });
    });
});
