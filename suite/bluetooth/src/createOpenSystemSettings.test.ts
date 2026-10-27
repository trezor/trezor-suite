import { notificationsActions } from '@suite-common/toast-notifications';

import { createOpenSystemSettings } from './createOpenSystemSettings';

// The toast id is a timestamp, so match the action by type and payload instead of building it again.
const errorToast = (error: string) =>
    expect.objectContaining({
        type: notificationsActions.addToast.type,
        payload: expect.objectContaining({ type: 'error', error }),
    });

const setup = (openSystemSettings: jest.Mock) => {
    const dispatch = jest.fn();
    const open = createOpenSystemSettings({ desktopApi: { openSystemSettings }, dispatch });

    return { dispatch, open };
};

describe('createOpenSystemSettings', () => {
    it('returns the result and dispatches no toast on success', async () => {
        const openSystemSettings = jest.fn().mockResolvedValue({ success: true });
        const { dispatch, open } = setup(openSystemSettings);

        await expect(open('bluetooth')).resolves.toEqual({ success: true });
        expect(openSystemSettings).toHaveBeenCalledWith('bluetooth');
        expect(dispatch).not.toHaveBeenCalled();
    });

    it('dispatches an error toast when the call reports failure', async () => {
        const openSystemSettings = jest.fn().mockResolvedValue({ success: false, error: 'nope' });
        const { dispatch, open } = setup(openSystemSettings);

        await expect(open('bluetooth-permissions')).resolves.toEqual({
            success: false,
            error: 'nope',
        });
        expect(dispatch).toHaveBeenCalledWith(errorToast('nope'));
    });

    it('resolves a failure and dispatches an error toast when the call rejects', async () => {
        const openSystemSettings = jest.fn().mockRejectedValue(new Error('ipc failed'));
        const { dispatch, open } = setup(openSystemSettings);

        await expect(open('bluetooth')).resolves.toEqual({ success: false, error: 'ipc failed' });
        expect(dispatch).toHaveBeenCalledWith(errorToast('ipc failed'));
    });
});
