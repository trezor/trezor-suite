import { moveLabelsForRbfOldMetadataThunk } from './moveLabelsForRbfOldMetadataThunk';
import type { Dispatch } from '../../../types/suite';
import type { RbfLabelsToBeUpdated } from '../../../types/wallet/sendForm';

type MoveLabelsForRbfThunkParams = {
    newTxid: string;
    toBeMovedOrDeletedList: RbfLabelsToBeUpdated;
};

export const moveLabelsForRbfThunk =
    ({ toBeMovedOrDeletedList, newTxid }: MoveLabelsForRbfThunkParams) =>
    async (dispatch: Dispatch) => {
        for (const toBeMovedOrDeleted of Object.entries(toBeMovedOrDeletedList)) {
            const [accountKey, data] = toBeMovedOrDeleted;

            await dispatch(moveLabelsForRbfOldMetadataThunk({ accountKey, data, newTxid }));
        }
    };
