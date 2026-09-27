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
    parent?: NativeSheet;
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
        const existingIndex = sheets.findIndex(entry => entry.sheet === sheet);
        const existing = sheets[existingIndex];
        if (existing && existing.phase !== 'closing' && !existing.shouldDismiss) return;

        const parentIndex = existingIndex >= 0 ? existingIndex - 1 : sheets.length - 1;
        const parent = isNested ? sheets[parentIndex] : undefined;
        if (parent?.phase === 'closing' || parent?.shouldDismiss) return;

        pendingSheet = { sheet, isNested, parent: parent?.sheet };
        advance();
    };

    const dismiss = (sheet: NativeSheet) => {
        if (pendingSheet?.sheet === sheet) pendingSheet = undefined;

        const index = sheets.findIndex(entry => entry.sheet === sheet);
        if (index < 0) return;

        for (const entry of sheets.slice(index)) {
            entry.shouldDismiss = true;
            if (pendingSheet?.parent === entry.sheet) pendingSheet = undefined;
        }

        advance();
    };

    const isOpen = (sheet: NativeSheet) => {
        const top = sheets.at(-1);

        return top?.sheet === sheet && top.phase === 'open' && !top.shouldDismiss;
    };

    const didPresent = (sheet: NativeSheet) => {
        const entry = sheets.find(candidate => candidate.sheet === sheet);
        if (entry?.phase === 'opening') {
            entry.phase = 'open';
            advance();
        }

        return isOpen(sheet);
    };

    const didDismiss = (sheet: NativeSheet) => {
        if (pendingSheet?.parent === sheet) pendingSheet = undefined;
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

    return { present, dismiss, didPresent, didDismiss, dismissAll, isOpen };
};

export const nativeSheetManager = createNativeSheetManager();
