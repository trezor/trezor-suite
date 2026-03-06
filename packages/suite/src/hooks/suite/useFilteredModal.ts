import { MODAL_CONTEXT_USER } from '@suite/modal';
import type { State as ModalState } from '@suite/modal';
import { UserContextPayload } from '@suite-common/suite-types';

import { useSelector } from 'src/hooks/suite';

type ModalContext = ModalState['context'];
type UserModalType = UserContextPayload['type'];
type UserModalState = Extract<ModalState, { context: typeof MODAL_CONTEXT_USER }>;

const hasGivenContext = <T extends ModalContext>(
    modal: ModalState,
    context: T[],
): modal is Extract<ModalState, { context: T }> => context.includes(modal.context as T);

const hasGivenUserModalType = <T extends UserModalType>(
    modal: UserModalState,
    type: T[],
): modal is Extract<UserModalState, { payload: { type: T } }> =>
    type.includes(modal.payload.type as T);

export const useFilteredModal = <T extends ModalContext>(
    context: T[],
    type?: T extends typeof MODAL_CONTEXT_USER ? UserModalType[] : never,
): Extract<ModalState, { context: T }> | null => {
    const modal = useSelector(state => state.modal);

    if (!hasGivenContext(modal, context)) {
        return null;
    }

    if (modal.context === MODAL_CONTEXT_USER) {
        const userModal = modal as UserModalState;

        if (type && !hasGivenUserModalType(userModal, type)) {
            return null;
        }
    }

    return modal;
};
