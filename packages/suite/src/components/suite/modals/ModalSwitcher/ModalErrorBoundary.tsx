import { type ReactNode } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

import { useTranslation } from '@suite/intl';
import { closeModal } from '@suite/modal';
import { notificationsActions } from '@suite-common/toast-notifications';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { reportToSentryThunk } from '#src/utils/suite/sentry';

type ModalErrorBoundaryProps = { children: ReactNode };

/**
 * Keeps a modal's failure inside the modal. The `lazy()` boundaries below reject when a chunk
 * cannot be fetched, and React hands that to the nearest boundary above, which is the app's, so one
 * unreachable chunk would replace the whole of Suite with its error screen. Closing the modal
 * leaves the rest of the app usable instead.
 *
 * This catches everything a modal throws while rendering, not only a missing chunk, so the error is
 * still reported rather than swallowed.
 *
 * No `resetKeys` are needed: the switch above renders nothing once the modal is closed, which
 * unmounts this boundary, and the next modal opens with a fresh one.
 */
export const ModalErrorBoundary = ({ children }: ModalErrorBoundaryProps) => {
    const { dispatch } = useServices(injectDispatch);
    const { translationString } = useTranslation();

    return (
        <ReactErrorBoundary
            fallbackRender={() => null}
            onError={error => {
                dispatch(reportToSentryThunk(error));
                dispatch(closeModal());
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: translationString('TR_GENERIC_ERROR_TITLE'),
                    }),
                );
            }}
        >
            {children}
        </ReactErrorBoundary>
    );
};
