import { getWeakRandomId } from '@trezor/utils';

import { experimentTest, getArrayOfInstanceIds } from './__fixtures__/experimentUtils';
import {
    buildExperimentGroupRanges,
    getActiveExperimentGroup,
    getExperimentGroupByInclusion,
    getInclusionFromInstanceId,
    resolveExperimentGroup,
} from './experimentUtils';
import { type ExperimentId } from './messageSystemTypes';

jest.mock('@trezor/utils', () => ({
    ...jest.requireActual('@trezor/utils'),
    getWeakRandomId: jest.fn(),
}));

describe('testing experiment utils', () => {
    const experimentId = 'e2e8d05f-1469-4e47-9ab0-53544e5cad07' as ExperimentId;

    describe('getInclusionFromInstanceId', () => {
        it('test getInclusionFromInstanceId whether returns percentage between 0 and 99', () => {
            const arrayOfIds = getArrayOfInstanceIds(100);
            const isExistNumberOutOfRange = arrayOfIds.some(id => {
                const percentage = getInclusionFromInstanceId(id, experimentId);

                return percentage < 0 || percentage > 99;
            });

            expect(isExistNumberOutOfRange).toEqual(false);
        });
    });

    describe('buildExperimentGroupRanges', () => {
        it('should build correct ranges for experiment groups', () => {
            const groups = [
                { percentage: 50, variant: 'A' },
                { percentage: 30, variant: 'B' },
                { percentage: 20, variant: 'C' },
            ];

            const ranges = buildExperimentGroupRanges(groups);

            expect(ranges).toEqual([
                { group: groups[0], range: { start: 0, end: 50 } },
                { group: groups[1], range: { start: 50, end: 80 } },
                { group: groups[2], range: { start: 80, end: 100 } },
            ]);
        });
    });

    describe('getExperimentGroupByInclusion', () => {
        it('should return the correct group for a given inclusion value', () => {
            const groups = [
                { percentage: 50, variant: 'A' },
                { percentage: 30, variant: 'B' },
                { percentage: 20, variant: 'C' },
            ];

            expect(getExperimentGroupByInclusion({ groups, inclusion: 25 })).toEqual(groups[0]);
            expect(getExperimentGroupByInclusion({ groups, inclusion: 75 })).toEqual(groups[1]);
            expect(getExperimentGroupByInclusion({ groups, inclusion: 95 })).toEqual(groups[2]);
        });

        it('should throw an error for inclusion values out of range', () => {
            const groups = [
                { percentage: 50, variant: 'A' },
                { percentage: 30, variant: 'B' },
                { percentage: 20, variant: 'C' },
            ];

            expect(() => getExperimentGroupByInclusion({ groups, inclusion: -1 })).toThrow(
                'inclusion must be in [0, 99]',
            );
            expect(() => getExperimentGroupByInclusion({ groups, inclusion: 100 })).toThrow(
                'inclusion must be in [0, 99]',
            );
        });

        it('test getExperimentGroupByInclusion whether instanceId is not in range of variants', () => {
            const arrayOfIds = getArrayOfInstanceIds(100);
            const isExistInstanceIdNotInVariantRange = arrayOfIds.some(id => {
                const inclusion = getInclusionFromInstanceId(id, experimentId);
                const group = getExperimentGroupByInclusion({
                    groups: experimentTest.groups,
                    inclusion,
                });

                return group === undefined;
            });

            expect(isExistInstanceIdNotInVariantRange).toEqual(false);
        });
    });

    describe('getActiveExperimentGroup', () => {
        const mockRandomInt = (isAGroup: boolean) => {
            (getWeakRandomId as jest.Mock).mockImplementation(() =>
                isAGroup ? '1XxK0mwana' : 'AyRQxROQKW',
            );
        };

        it('test getActiveExperimentGroup share of variant inclusion', () => {
            const sampleSize = 1000;
            let groupACount = 0;
            let groupBCount = 0;

            mockRandomInt(true);
            const arrayOfIdsAGroup = getArrayOfInstanceIds(
                sampleSize * (experimentTest.groups[0].percentage / 100),
            );
            mockRandomInt(false);
            const arrayOfIdsBGroup = getArrayOfInstanceIds(
                sampleSize * (experimentTest.groups[1].percentage / 100),
            );

            const arrayOfIds = [...arrayOfIdsAGroup, ...arrayOfIdsBGroup];

            arrayOfIds.forEach(id => {
                const selectedGroup = getActiveExperimentGroup({
                    experiment: experimentTest,
                    instanceId: id,
                });

                if (selectedGroup?.variant === 'A') {
                    groupACount += 1;
                }

                if (selectedGroup?.variant === 'B') {
                    groupBCount += 1;
                }
            });

            const shareA = groupACount / sampleSize;
            const shareB = groupBCount / sampleSize;

            expect(shareA).toEqual(experimentTest.groups[0].percentage / 100);
            expect(shareB).toEqual(experimentTest.groups[1].percentage / 100);
        });
    });

    describe('resolveExperimentGroup', () => {
        const groups = [
            { variant: 'A', percentage: 100 },
            { variant: 'B', percentage: 0 },
        ];
        const experiment = { id: experimentId, groups };
        const instanceId = 'test-instance-id';

        it('returns the group assigned by instance ID when nothing is overridden', () => {
            expect(resolveExperimentGroup({ experiment, instanceId })).toEqual(groups[0]);
        });

        it('returns the forced variant even when its percentage is 0', () => {
            expect(
                resolveExperimentGroup({ experiment, instanceId, variantOverride: 'B' }),
            ).toEqual(groups[1]);
        });

        it('returns the forced variant when instance ID is missing', () => {
            expect(
                resolveExperimentGroup({ experiment, instanceId: undefined, variantOverride: 'B' }),
            ).toEqual(groups[1]);
        });

        it('prefers the forced variant to the inclusion override', () => {
            expect(
                resolveExperimentGroup({
                    experiment,
                    instanceId,
                    variantOverride: 'B',
                    inclusionOverride: 10,
                }),
            ).toEqual(groups[1]);
        });

        it('ignores a forced variant that the experiment does not have', () => {
            expect(
                resolveExperimentGroup({ experiment, instanceId, variantOverride: 'C' }),
            ).toEqual(groups[0]);
        });

        it('returns the group matching the inclusion override', () => {
            const evenGroups = [
                { variant: 'A', percentage: 50 },
                { variant: 'B', percentage: 50 },
            ];

            expect(
                resolveExperimentGroup({
                    experiment: { id: experimentId, groups: evenGroups },
                    instanceId: undefined,
                    inclusionOverride: 75,
                }),
            ).toEqual(evenGroups[1]);
        });

        it('returns undefined when the experiment is missing', () => {
            expect(
                resolveExperimentGroup({ experiment: undefined, instanceId, variantOverride: 'B' }),
            ).toBeUndefined();
        });
    });
});
