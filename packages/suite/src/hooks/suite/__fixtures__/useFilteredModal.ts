import { MODAL } from 'src/actions/suite/constants';
import { useFilteredModal } from '../useFilteredModal';

export const filters: Parameters<typeof useFilteredModal>[] = [
    [[MODAL.CONTEXT_USER]],
    [[MODAL.CONTEXT_DEVICE_CONFIRMATION]],
    [[MODAL.CONTEXT_DEVICE, MODAL.CONTEXT_USER], ['application-log']],
    [[MODAL.CONTEXT_USER], ['qr-reader']],
];

export const fixtures = [
    [
        'No modal',
        {
            context: MODAL.CONTEXT_NONE,
        },
        [false, false, false, false],
    ],
    [
        'Log user modal',
        {
            context: MODAL.CONTEXT_USER,
            payload: {
                type: 'application-log',
            },
        },
        [true, false, true, false],
    ],
    [
        'Device modal',
        {
            context: MODAL.CONTEXT_DEVICE,
            device: null as any,
        },
        [false, false, true, false],
    ],
    [
        'Device confirmation modal',
        {
            context: MODAL.CONTEXT_DEVICE_CONFIRMATION,
            windowType: '',
        },
        [false, true, false, false],
    ],
] as const;
