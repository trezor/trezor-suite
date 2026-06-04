export type DiscreetModeRootState = {
    wallet: {
        settings: {
            discreetMode: boolean;
        };
    };
};

export const selectIsDiscreteModeActive = (state: DiscreetModeRootState) =>
    state.wallet.settings.discreetMode;
