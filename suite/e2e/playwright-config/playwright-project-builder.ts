import { Project, devices } from '@playwright/test';

import { MODELS, Model } from '@trezor/trezor-user-env-link';

import { PlaywrightTarget } from './playwright-base.config';

export class PlaywrightProjectBuilder {
    private project: Project;

    constructor(target: PlaywrightTarget, nameOrModel: string | Model) {
        switch (target) {
            case PlaywrightTarget.Web:
                this.project = {
                    name: nameOrModel,
                    use: {
                        ...devices['Desktop Chrome'],
                        channel: 'chromium',
                        baseURL: process.env.BASE_URL || 'http://localhost:8000/',
                        target: PlaywrightTarget.Web,
                    },
                    grepInvert: [/@desktopOnly/, /@group=manual/],
                    grep: [],
                };
                break;
            case PlaywrightTarget.Desktop:
                this.project = {
                    name: nameOrModel,
                    use: {
                        target: PlaywrightTarget.Desktop,
                    },
                    grepInvert: [/@webOnly/, /@group=manual/],
                    grep: [],
                };
                break;
            default:
                throw new Error(`Unknown target: ${target}`);
        }

        if (MODELS.includes(nameOrModel as Model)) {
            this.setModel(nameOrModel as Model);
            this.addGrep(new RegExp(`(?=.*@${nameOrModel})`));
        }
    }

    setModel(model: Model): this {
        this.project.use = { ...this.project.use, model };

        return this;
    }

    setGrep(pattern: RegExp | RegExp[]): this {
        this.project.grep = pattern;

        return this;
    }

    addGrep(pattern: RegExp): this {
        const current = this.project.grep;
        this.project.grep = Array.isArray(current)
            ? [...current, pattern]
            : [current as RegExp, pattern];

        return this;
    }

    addGrepInvert(pattern: RegExp): this {
        const current = this.project.grepInvert;
        this.project.grepInvert = Array.isArray(current)
            ? [...current, pattern]
            : [current as RegExp, pattern];

        return this;
    }

    build(): Project {
        return this.project;
    }
}
