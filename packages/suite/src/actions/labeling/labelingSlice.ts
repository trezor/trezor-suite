import {
    LabelingState,
    initialLabelingState as commonInitialState,
    prepareLabelingReducer,
} from '@suite-common/local-first-storage';
import { AnyAction, createSliceWithExtraDeps } from '@suite-common/redux-utils';

export type DesktopLabelingState = LabelingState & {
    showEnableLocalFirstStorageModal: boolean;
};

export const initialLabelingState: DesktopLabelingState = {
    ...commonInitialState,
    showEnableLocalFirstStorageModal: false,
};

export type DesktopLabelingRootState = {
    labeling: DesktopLabelingState;
};

export const labelingSlice = createSliceWithExtraDeps({
    name: 'labeling',
    initialState: initialLabelingState,
    reducers: {
        updateShowEnableLocalFirstStorageModal: (state, action) => {
            state.showEnableLocalFirstStorageModal = action.payload.show;
        },
    },
    extraReducers: (builder, extra) => {
        const commonReducer = prepareLabelingReducer(extra);

        builder.addDefaultCase((state, action) => {
            commonReducer(state, action as AnyAction);
        });
    },
});

export const { updateShowEnableLocalFirstStorageModal } = labelingSlice.actions;
