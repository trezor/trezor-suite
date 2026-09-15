import { powerSaveBlocker } from 'electron';

export class PowerSaveBlocker {
    private powerSaveBlockerId: number | null;
    private logger: ILogger;

    constructor() {
        this.logger = global.logger;
        this.powerSaveBlockerId = null;
    }

    startBlockingPowerSave() {
        if (this.powerSaveBlockerId && this.isBlocking(this.powerSaveBlockerId)) {
            this.logger.info('power-save-blocker', 'Power save is already blocked');

            return;
        }
        this.logger.info('power-save-blocker', 'Start blocking power save');
        this.powerSaveBlockerId = powerSaveBlocker.start('prevent-display-sleep');
    }

    stopBlockingPowerSave() {
        if (!this.powerSaveBlockerId || !this.isBlocking(this.powerSaveBlockerId)) return;
        this.logger.info('power-save-blocker', 'Stop blocking power save');
        powerSaveBlocker.stop(this.powerSaveBlockerId);
        this.powerSaveBlockerId = null;
    }

    private isBlocking(id: number | undefined) {
        if (!id) return false;

        return powerSaveBlocker.isStarted(id);
    }
}
