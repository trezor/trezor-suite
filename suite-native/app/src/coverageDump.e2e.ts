import { AppState } from 'react-native';

import { File, Paths } from 'expo-file-system';

import { launchArguments } from '@suite-native/config';

type IstanbulFileCoverage = {
    s: Record<string, number>;
    [key: string]: unknown;
};

const writeCoverageToFile = () => {
    const coverage = (global as unknown as { __coverage__?: Record<string, IstanbulFileCoverage> })
        .__coverage__;

    if (!coverage) return;

    const file = new File(Paths.document, 'coverage.json');
    file.write(JSON.stringify(coverage));
};

export const initCoverageDump = () => {
    if (!launchArguments.collectCoverageMap) return;

    AppState.addEventListener('change', nextState => {
        if (nextState === 'background' || nextState === 'inactive') {
            try {
                writeCoverageToFile();
            } catch (e) {
                console.error(e);
            }
        }
    });
};
