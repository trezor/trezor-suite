import { useSelector } from 'src/hooks/suite';
import { MODAL } from 'src/actions/suite/constants';
import type { State as ModalState } from 'src/reducers/suite/modalReducer';
import type { UserContextPayload } from 'src/actions/suite/modalActions';

type ModalContext = ModalState['context'];
type UserModalType = UserContextPayload['type'];
type UserModalState = Extract<ModalState, { context: typeof MODAL.CONTEXT_USER }>;

const hasGivenContext = <T extends ModalContext>(
    modal: ModalState,
    context: T[],
): modal is Extract<ModalState, { context: T }> => context.includes(modal.context as any);

const hasGivenUserModalType = <T extends UserModalType>(
    modal: UserModalState,
    type: T[],
): modal is Extract<UserModalState, { payload: { type: T } }> =>
    type.includes(modal.payload.type as any);

export const useFilteredModal = <T extends ModalContext>(
    context: T[],
    type?: T extends typeof MODAL.CONTEXT_USER ? UserModalType[] : never,
): Extract<ModalState, { context: T }> | null => {
    const modal = useSelector(state => state.modal);

    if (!hasGivenContext(modal, context)) {
        return null;
    }

    if (modal.context === MODAL.CONTEXT_USER && type && !hasGivenUserModalType(modal, type)) {
        return null;
    }

    return modal;
};
