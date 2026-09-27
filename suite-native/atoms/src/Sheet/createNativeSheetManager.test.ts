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
        manager.present(parent);

        expect(parent.present).toHaveBeenCalledTimes(1);
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

    it('allows interaction only with the current open sheet', () => {
        const manager = createNativeSheetManager();
        const sheet = createSheet();

        expect(manager.isOpen(sheet)).toBe(false);
        expect(manager.didPresent(sheet)).toBe(false);

        manager.present(sheet);
        expect(manager.isOpen(sheet)).toBe(false);

        expect(manager.didPresent(sheet)).toBe(true);
        expect(manager.isOpen(sheet)).toBe(true);

        manager.dismiss(sheet);
        expect(manager.isOpen(sheet)).toBe(false);
        expect(manager.didPresent(sheet)).toBe(false);

        manager.didDismiss(sheet);
        expect(manager.isOpen(sheet)).toBe(false);
    });

    it('does not allow focus when an opening sheet is immediately replaced', () => {
        const manager = createNativeSheetManager();
        const first = createSheet();
        const replacement = createSheet();

        manager.present(first);
        manager.present(replacement);

        expect(manager.didPresent(first)).toBe(false);
        expect(first.dismiss).toHaveBeenCalledTimes(1);
        expect(manager.isOpen(first)).toBe(false);
    });

    it('suspends parent interaction while a nested child opens and restores it on dismissal', () => {
        const manager = createNativeSheetManager();
        const parent = createSheet();
        const child = createSheet();

        manager.present(parent);
        manager.present(child, true);

        expect(manager.didPresent(parent)).toBe(false);
        expect(manager.isOpen(parent)).toBe(false);
        expect(manager.didPresent(child)).toBe(true);

        manager.dismiss(child);
        expect(manager.isOpen(parent)).toBe(false);

        manager.didDismiss(child);
        expect(manager.isOpen(parent)).toBe(true);
    });

    it('cancels a queued nested child when its opening parent is closed', () => {
        const manager = createNativeSheetManager();
        const parent = createSheet();
        const child = createSheet();

        manager.present(parent);
        manager.present(child, true);
        manager.dismiss(parent);
        manager.didPresent(parent);
        manager.didDismiss(parent);

        expect(child.present).not.toHaveBeenCalled();
    });

    it('cancels a queued nested child when its parent disappears natively', () => {
        const manager = createNativeSheetManager();
        const parent = createSheet();
        const child = createSheet();

        manager.present(parent);
        manager.present(child, true);
        manager.didDismiss(parent);

        expect(child.present).not.toHaveBeenCalled();
    });

    it('cancels a queued nested descendant when an ancestor is closed', () => {
        const manager = createNativeSheetManager();
        const parent = createSheet();
        const child = createSheet();
        const grandchild = createSheet();

        manager.present(parent);
        manager.didPresent(parent);
        manager.present(child, true);
        manager.present(grandchild, true);
        manager.dismiss(parent);
        manager.didPresent(child);
        manager.didDismiss(child);
        manager.didDismiss(parent);

        expect(grandchild.present).not.toHaveBeenCalled();
    });

    it('ignores a new nested child of a closing parent without losing its replacement', () => {
        const manager = createNativeSheetManager();
        const parent = createSheet();
        const replacement = createSheet();
        const child = createSheet();

        manager.present(parent);
        manager.didPresent(parent);
        manager.present(replacement);
        manager.present(child, true);
        manager.didDismiss(parent);

        expect(child.present).not.toHaveBeenCalled();
        expect(replacement.present).toHaveBeenCalledTimes(1);
    });

    it('can reopen a closing nested sheet under its original parent', () => {
        const manager = createNativeSheetManager();
        const parent = createSheet();
        const child = createSheet();

        manager.present(parent);
        manager.didPresent(parent);
        manager.present(child, true);
        manager.didPresent(child);
        manager.dismiss(child);
        manager.present(child, true);
        manager.didDismiss(child);

        expect(child.present).toHaveBeenCalledTimes(2);
        expect(parent.dismiss).not.toHaveBeenCalled();
    });
});
