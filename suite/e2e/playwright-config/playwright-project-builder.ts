import { PlaywrightTestOptions, PlaywrightWorkerOptions, Project, devices } from '@playwright/test';
import { RequireAtLeastOne } from 'type-fest';

import { Model } from '@trezor/trezor-user-env-link';

import { PlaywrightTarget, SuiteTestOptions } from '../support/testExtends/suiteTestOptions';

export type PlaywrightProjectDefinition = RequireAtLeastOne<
    {
        name?: string;
        model?: Model;
        nameSuffix?: string;
        grep?: RegExp;
        additionalGrepInvert?: RegExp;
        currentsTags?: string[];
        firmware?: string;
    },
    'name' | 'model'
>;

export class PlaywrightProjectBuilder {
    private project: Project<SuiteTestOptions & PlaywrightTestOptions, PlaywrightWorkerOptions>;

    constructor({
        target,
        name,
        model,
        nameSuffix,
    }: {
        target: PlaywrightTarget;
        name?: string;
        model?: Model;
        nameSuffix?: string;
    }) {
        const namePrefix = name ?? model; // at least one of them is guaranteed to be defined
        const projectName = nameSuffix ? `${namePrefix}_${nameSuffix}` : namePrefix;

        switch (target) {
            case PlaywrightTarget.Web:
                this.project = {
                    name: projectName,
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
                    name: projectName,
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
            this.setGrep(new RegExp(`^(?=.*@${model})`));
        }
    }

    get playwrightProject() {
        return this.project;
    }

    setModel(model: Model) {
        this.project.use = { ...this.project.use, model };
    }

    setFirmwareVersion(firmwareVersion: string) {
        this.project.use = { ...this.project.use, firmwareVersion };
    }

    setGrep(pattern: RegExp | RegExp[]) {
        this.project.grep = pattern;
    }

    addGrepInvert(pattern: RegExp) {
        const current = this.project.grepInvert;
        this.project.grepInvert = Array.isArray(current)
            ? [...current, pattern]
            : [current as RegExp, pattern];
    }

    setCurrentsTags(tags: string[]) {
        this.project.metadata = {
            ...this.project.metadata,
            pwc: {
                tags,
            },
        };
    }

    static buildFromDefinitions(
        target: PlaywrightTarget,
        definitions: PlaywrightProjectDefinition[],
    ): Project[] {
        return definitions.map(def => {
            const builder = new PlaywrightProjectBuilder({
                target,
                name: def.name,
                model: def.model,
                nameSuffix: def.nameSuffix,
            });
            if (def.grep) {
                builder.setGrep(def.grep);
            }
            if (def.additionalGrepInvert) {
                builder.addGrepInvert(def.additionalGrepInvert);
            }
            if (def.currentsTags) {
                builder.setCurrentsTags(def.currentsTags);
            }
            if (def.firmware) {
                builder.setFirmwareVersion(def.firmware);
            }

            return builder.playwrightProject;
        });
    }
}
