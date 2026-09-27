import { type NativeSheet, createNativeSheetManager } from './createNativeSheetManager';

const createSheet = (): NativeSheet => ({
    present: jest.fn(),
    dismiss: jest.fn(),
});

describe('createNativeSheetManager', () => {
    it('presents a sheet and waits for native dismissal before replacing it', () => {
        const manager = createNativeSheetManager();
        const first = createSheet();
        const second = createSheet();

        manager.present(first);
        manager.didPresent(first);
        manager.present(second);

        expect(first.present).toHaveBeenCalledTimes(1);
        expect(first.dismiss).toHaveBeenCalledTimes(1);
        expect(second.present).not.toHaveBeenCalled();

        manager.didDismiss(first);

        expect(second.present).toHaveBeenCalledTimes(1);
    });

    it('waits for the native content to mount before dismissing an opening sheet', () => {
        const manager = createNativeSheetManager();
        const first = createSheet();
        const second = createSheet();

        manager.present(first);
        manager.present(second);

        expect(first.dismiss).not.toHaveBeenCalled();
        expect(second.present).not.toHaveBeenCalled();

        manager.didPresent(first);

        expect(first.dismiss).toHaveBeenCalledTimes(1);
        expect(second.present).not.toHaveBeenCalled();

        manager.didDismiss(first);

        expect(second.present).toHaveBeenCalledTimes(1);
    });

    it('keeps only the latest replacement when sheets are requested rapidly', () => {
        const manager = createNativeSheetManager();
        const first = createSheet();
        const skipped = createSheet();
        const latest = createSheet();

        manager.present(first);
        manager.didPresent(first);
        manager.present(skipped);
        manager.present(latest);
        manager.didDismiss(first);

        expect(first.dismiss).toHaveBeenCalledTimes(1);
        expect(skipped.present).not.toHaveBeenCalled();
        expect(latest.present).toHaveBeenCalledTimes(1);
    });

    it('keeps the parent open for a nested sheet and dismisses the stack from the top', () => {
        const manager = createNativeSheetManager();
        const parent = createSheet();
        const child = createSheet();
        const replacement = createSheet();

        manager.present(parent);
        manager.didPresent(parent);
        manager.present(child, true);
        manager.didPresent(child);

        expect(parent.dismiss).not.toHaveBeenCalled();
        expect(child.present).toHaveBeenCalledTimes(1);

        manager.present(replacement);

        expect(child.dismiss).toHaveBeenCalledTimes(1);
        expect(parent.dismiss).not.toHaveBeenCalled();

        manager.didDismiss(child);

        expect(parent.dismiss).toHaveBeenCalledTimes(1);
        expect(replacement.present).not.toHaveBeenCalled();

        manager.didDismiss(parent);

        expect(replacement.present).toHaveBeenCalledTimes(1);
    });

    it('cancels a queued presentation when its owner closes or unmounts', () => {
        const manager = createNativeSheetManager();
        const first = createSheet();
        const pending = createSheet();

        manager.present(first);
        manager.didPresent(first);
        manager.present(pending);
        manager.dismiss(pending);
        manager.didDismiss(first);

        expect(pending.present).not.toHaveBeenCalled();
    });

    it('dismisses an opening sheet once it is mounted and never repeats dismissal', () => {
        const manager = createNativeSheetManager();
        const sheet = createSheet();

        manager.present(sheet);
        manager.dismiss(sheet);

        expect(sheet.dismiss).not.toHaveBeenCalled();

        manager.didPresent(sheet);
        manager.dismiss(sheet);
        manager.didPresent(sheet);

        expect(sheet.dismiss).toHaveBeenCalledTimes(1);
    });

    it('does not reopen an already presented sheet or disturb its nested child', () => {
        const manager = createNativeSheetManager();
        const parent = createSheet();
        const child = createSheet();

        manager.present(parent);
        manager.didPresent(parent);
        manager.present(child, true);
        manager.didPresent(child);
        manager.present(child, true);

        expect(child.present).toHaveBeenCalledTimes(1);
        expect(parent.dismiss).not.toHaveBeenCalled();
        expect(child.dismiss).not.toHaveBeenCalled();
    });

    it('clears a pending replacement when all sheets are dismissed', () => {
        const manager = createNativeSheetManager();
        const first = createSheet();
        const pending = createSheet();

        manager.present(first);
        manager.didPresent(first);
        manager.present(pending);
        manager.dismissAll();
        manager.didDismiss(first);

        expect(pending.present).not.toHaveBeenCalled();
    });
});
