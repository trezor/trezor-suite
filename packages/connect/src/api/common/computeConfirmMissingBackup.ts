type Item = {
    showOnTrezor: boolean | undefined;
    suppressBackupWarning: boolean | undefined;
};

// Shared semantics for `*GetPublicKey` methods: ask the user to confirm
// missing backup only when at least one batch wants to display the key on
// the device and does not explicitly suppress the warning. Background
// fetches (no `showOnTrezor`) are silent.
export const computeConfirmMissingBackup = (items: Item[]) =>
    !items.every(item => item.suppressBackupWarning || !item.showOnTrezor);
