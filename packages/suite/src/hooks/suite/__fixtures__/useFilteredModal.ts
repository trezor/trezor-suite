import {
    MODAL_CONTEXT_DEVICE,
    MODAL_CONTEXT_DEVICE_CONFIRMATION,
    MODAL_CONTEXT_NONE,
    MODAL_CONTEXT_USER,
} from '@suite/modal';

import { type useFilteredModal } from '../useFilteredModal';

export const filters: Parameters<typeof useFilteredModal>[] = [
    [[MODAL_CONTEXT_USER]],
    [[MODAL_CONTEXT_DEVICE_CONFIRMATION]],
    [[MODAL_CONTEXT_DEVICE, MODAL_CONTEXT_USER], ['application-log']],
    [[MODAL_CONTEXT_USER], ['qr-reader']],
];

export const fixtures = [
    [
        'No modal',
        {
            context: MODAL_CONTEXT_NONE,
        },
        [false, false, false, false],
    ],
    [
        'Log user modal',
        {
            context: MODAL_CONTEXT_USER,
            payload: {
                type: 'application-log',
            },
        },
        [true, false, true, false],
    ],
    [
        'Device modal',
        {
            context: MODAL_CONTEXT_DEVICE,
            device: null as any,
        },
        [false, false, true, false],
    ],
    [
        'Device confirmation modal',
        {
            context: MODAL_CONTEXT_DEVICE_CONFIRMATION,
            windowType: 'no-backup',
        },
        [false, true, false, false],
    ],
] as const;
