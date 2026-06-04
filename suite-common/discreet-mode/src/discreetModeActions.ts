export const SET_DISCREET_MODE = '@wallet-settings/hide-balance' as const;

export type SetDiscreetModeAction = {
    type: typeof SET_DISCREET_MODE;
    toggled: boolean;
};

export const setDiscreetMode = (toggled: boolean): SetDiscreetModeAction => ({
    type: SET_DISCREET_MODE,
    toggled,
});
