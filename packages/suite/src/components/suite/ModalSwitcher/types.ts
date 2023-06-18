import { MODAL } from 'src/actions/suite/constants';
import type { AppState } from 'src/types/suite';
import type { ModalProps } from '../Modal';

/**
 * Recovery process is currently the only place where the raw-rendered (inlined)
 * modals are still used.
 * Based on code analysis, only the following modals could
 * be raw-rendered there: Word, WordAdvanced, ConfirmAction, ConfirmNoBackup,
 * ConfirmFingerPrint, Pin, PinInvalid, PinMismatch.
 * After resolving these, whole Modal.render mechanism could be removed.
 */
export type ReduxModalProps<
    T extends AppState['modal']['context'] = Exclude<
        AppState['modal']['context'],
        typeof MODAL.CONTEXT_NONE
    >,
> = Extract<AppState['modal'], { context: T }> & {
    renderer?: ModalProps['renderer'];
};
