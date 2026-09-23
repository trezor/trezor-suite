import { createMockDeps } from '@suite-common/dependency-injection';

import { type PowerSaveBlockerDeps, createPowerSaveBlocker } from './createPowerSaveBlocker';

const createDeps = () => {
    const activeBlockerIds = new Set<number>();
    let nextBlockerId = 0;

    const deps = createMockDeps<PowerSaveBlockerDeps>({
        electronPowerSaveBlocker: {
            start: () => {
                const id = nextBlockerId++;
                activeBlockerIds.add(id);

                return id;
            },
            stop: id => activeBlockerIds.delete(id),
        },
        logger: { info: () => {} },
    });

    return { deps, activeBlockerIds };
};

describe(createPowerSaveBlocker.name, () => {
    it('releases the blocker with ID 0', () => {
        const { deps, activeBlockerIds } = createDeps();
        const release = createPowerSaveBlocker(deps).blockPowerSave();

        expect(activeBlockerIds).toEqual(new Set([0]));

        release();

        expect(activeBlockerIds.size).toBe(0);
    });

    it('keeps overlapping blocks independent', () => {
        const { deps, activeBlockerIds } = createDeps();
        const powerSaveBlocker = createPowerSaveBlocker(deps);
        const releaseFirst = powerSaveBlocker.blockPowerSave();
        const releaseSecond = powerSaveBlocker.blockPowerSave();

        releaseFirst();

        expect(activeBlockerIds).toEqual(new Set([1]));

        releaseSecond();

        expect(activeBlockerIds.size).toBe(0);
    });

    it('stops the blocker only once when released repeatedly', () => {
        const { deps } = createDeps();
        const release = createPowerSaveBlocker(deps).blockPowerSave();

        release();
        release();

        expect(deps.electronPowerSaveBlocker.stop).toHaveBeenCalledTimes(1);
    });
});
