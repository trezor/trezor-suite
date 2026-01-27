import { PlaywrightTestOptions, PlaywrightWorkerOptions, Project, devices } from '@playwright/test';

import { Model } from '@trezor/trezor-user-env-link';

import { PlaywrightTarget, SuiteTestOptions } from '../support/testExtends/suiteTestOptions';

export class PlaywrightProjectBuilder {
    private project: Project<SuiteTestOptions & PlaywrightTestOptions, PlaywrightWorkerOptions>;

    constructor(target: PlaywrightTarget, nameOrModel: string | Model, nameSuffix?: string) {
        const model: Model | undefined = nameOrModel in Model ? (nameOrModel as Model) : undefined;

        const name = nameSuffix ? `${nameOrModel}_${nameSuffix}` : (nameOrModel as string);

        switch (target) {
            case PlaywrightTarget.Web:
                this.project = {
                    name,
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
                    name,
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

        if (model) {
            const defaultFirmwareMajorVersion = model === Model.T1B1 ? 1 : 2;
            this.setFirmwareVersion(`${defaultFirmwareMajorVersion}-latest`);
            this.setModel(model);
            this.addGrep(new RegExp(`(?=.*@${model})`));
        }
    }

    setModel(model: Model): this {
        this.project.use = { ...this.project.use, model };

        return this;
    }

    setFirmwareVersion(firmwareVersion: string): this {
        this.project.use = { ...this.project.use, firmwareVersion };

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

    setCurrentsTags(tags: string[]): this {
        this.project.metadata = {
            ...this.project.metadata,
            pwc: {
                tags,
            },
        };

        return this;
    }

    build(): Project {
        return this.project;
    }
}
