import ArtifactPathBuilder from 'detox/src/artifacts/utils/ArtifactPathBuilder';
import * as fs from 'fs';
import * as path from 'path';

import type { TestAttempts } from './testAttempts';

export const DETOX_ARTIFACTS_DIR = 'artifacts';

export type CurrentsArtifact = {
    path: string;
    type: 'video' | 'screenshot' | 'attachment';
    contentType: string;
    name: string;
};

const ARTIFACT_TYPES_BY_EXTENSION: Record<
    string,
    Pick<CurrentsArtifact, 'type' | 'contentType'>
> = {
    '.mp4': { type: 'video', contentType: 'video/mp4' },
    '.png': { type: 'screenshot', contentType: 'image/png' },
    '.log': { type: 'attachment', contentType: 'text/plain' },
};

export const listDetoxArtifactsRootDirs = (detoxConfiguration: string): string[] => {
    if (!fs.existsSync(DETOX_ARTIFACTS_DIR)) return [];

    return fs
        .readdirSync(DETOX_ARTIFACTS_DIR)
        .filter(dirName => dirName.startsWith(`${detoxConfiguration}.`))
        .map(dirName => path.join(DETOX_ARTIFACTS_DIR, dirName));
};

export const findNewDetoxArtifactsRootDir = (
    detoxConfiguration: string,
    previousRootDirs: string[],
): string | undefined =>
    listDetoxArtifactsRootDirs(detoxConfiguration)
        .filter(rootDir => !previousRootDirs.includes(rootDir))
        .toSorted()
        .at(-1);

type GetAttemptArtifactsParams = {
    rootDir: string;
    fullName: string;
    status: TestAttempts['status'];
    /** 1-based, the same counting Detox uses for the ` (n)` directory suffix of retried tests. */
    invocation: number;
};

export const getAttemptArtifacts = ({
    rootDir,
    fullName,
    status,
    invocation,
}: GetAttemptArtifactsParams): CurrentsArtifact[] => {
    const pathBuilder = new ArtifactPathBuilder({ rootDir });
    const testDir = path.dirname(
        pathBuilder.buildPathForTestArtifact('test.mp4', {
            fullName,
            status,
            invocations: invocation,
        }),
    );

    if (!fs.existsSync(testDir)) return [];

    return fs
        .readdirSync(testDir)
        .toSorted()
        .flatMap(fileName => {
            const artifactType = ARTIFACT_TYPES_BY_EXTENSION[path.extname(fileName)];
            if (!artifactType) return [];

            return [
                {
                    ...artifactType,
                    path: path.join(testDir, fileName),
                    name: `attempt ${invocation} ${fileName}`,
                },
            ];
        });
};
