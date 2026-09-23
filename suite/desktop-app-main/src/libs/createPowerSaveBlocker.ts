import type { PowerSaveBlocker as ElectronPowerSaveBlocker } from 'electron';

export type PowerSaveBlockerDeps = {
    electronPowerSaveBlocker: Pick<ElectronPowerSaveBlocker, 'start' | 'stop'>;
    logger: Pick<ILogger, 'info'>;
};

export type ReleasePowerSaveBlocker = () => void;

export type PowerSaveBlocker = {
    blockPowerSave: () => ReleasePowerSaveBlocker;
};

export type PowerSaveBlockerDep = {
    powerSaveBlocker: PowerSaveBlocker;
};

export const createPowerSaveBlocker = (deps: PowerSaveBlockerDeps): PowerSaveBlocker => ({
    blockPowerSave: () => {
        deps.logger.info('power-save-blocker', 'Start blocking power save');
        const blockerId = deps.electronPowerSaveBlocker.start('prevent-display-sleep');
        let isReleased = false;

        return () => {
            if (isReleased) return;
            isReleased = true;
            deps.logger.info('power-save-blocker', 'Stop blocking power save');
            deps.electronPowerSaveBlocker.stop(blockerId);
        };
    },
});
