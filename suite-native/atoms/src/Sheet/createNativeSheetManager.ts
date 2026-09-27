export type NativeSheet = {
    present: () => void;
    dismiss: () => void;
};

type SheetEntry = {
    sheet: NativeSheet;
    phase: 'opening' | 'open' | 'closing';
    shouldDismiss: boolean;
};

type PendingSheet = {
    sheet: NativeSheet;
    isNested: boolean;
};

export const createNativeSheetManager = () => {
    let sheets: SheetEntry[] = [];
    let pendingSheet: PendingSheet | undefined;

    const advance = () => {
        const top = sheets.at(-1);

        if (top) {
            if (top.phase !== 'open') return;

            if (top.shouldDismiss || (pendingSheet && !pendingSheet.isNested)) {
                top.phase = 'closing';
                top.sheet.dismiss();

                return;
            }
        }

        if (!pendingSheet) return;

        const { sheet } = pendingSheet;
        pendingSheet = undefined;
        sheets.push({ sheet, phase: 'opening', shouldDismiss: false });
        sheet.present();
    };

    const present = (sheet: NativeSheet, isNested = false) => {
        const existing = sheets.find(entry => entry.sheet === sheet);
        if (existing && existing.phase !== 'closing' && !existing.shouldDismiss) return;

        pendingSheet = { sheet, isNested };
        advance();
    };

    const dismiss = (sheet: NativeSheet) => {
        if (pendingSheet?.sheet === sheet) pendingSheet = undefined;

        const index = sheets.findIndex(entry => entry.sheet === sheet);
        if (index < 0) return;

        for (const entry of sheets.slice(index)) {
            entry.shouldDismiss = true;
        }

        advance();
    };

    const didPresent = (sheet: NativeSheet) => {
        const entry = sheets.find(candidate => candidate.sheet === sheet);
        if (entry?.phase !== 'opening') return;

        entry.phase = 'open';
        advance();
    };

    const didDismiss = (sheet: NativeSheet) => {
        sheets = sheets.filter(entry => entry.sheet !== sheet);
        advance();
    };

    const dismissAll = () => {
        pendingSheet = undefined;
        for (const entry of sheets) {
            entry.shouldDismiss = true;
        }
        advance();
    };

    return { present, dismiss, didPresent, didDismiss, dismissAll };
};

export const nativeSheetManager = createNativeSheetManager();
