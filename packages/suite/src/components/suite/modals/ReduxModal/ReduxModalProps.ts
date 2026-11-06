import { type MODAL_CONTEXT_NONE, type State as ModalState } from '@suite/modal';

export type ReduxModalProps<
    T extends ModalState['context'] = Exclude<ModalState['context'], typeof MODAL_CONTEXT_NONE>,
> = Extract<ModalState, { context: T }>;
