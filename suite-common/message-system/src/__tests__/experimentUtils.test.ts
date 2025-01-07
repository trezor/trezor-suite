import {
    getExperimentGroupByInclusion,
    getInclusionFromInstanceId,
    selectActiveExperimentGroup,
} from '../experimentUtils';
import { experimentTest, getArrayOfInstanceIds } from '../__fixtures__/experimentUtils';
import { ExperimentId } from '../messageSystemTypes';

describe('testing experiment utils', () => {
    const experimentId = 'e2e8d05f-1469-4e47-9ab0-53544e5cad07' as ExperimentId;

    it('test getInclusionFromInstanceId whether returns percentage between 0 and 99', () => {
        const arrayOfIds = getArrayOfInstanceIds(100);
        const isExistNumberOutOfRange = arrayOfIds.some(id => {
            const percentage = getInclusionFromInstanceId(id, experimentId);

            return percentage < 0 || percentage > 99;
        });

        expect(isExistNumberOutOfRange).toEqual(false);
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

    it('test selectActiveExperimentGroup share of variant inclusion', () => {
        const deviation = 0.05;
        const sampleSize = 1000;
        let groupACount = 0;
        let groupBCount = 0;

        const arrayOfIds = getArrayOfInstanceIds(sampleSize);

        arrayOfIds.forEach(id => {
            const selectedGroup = selectActiveExperimentGroup({
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

        expect(shareA).toBeGreaterThanOrEqual(
            experimentTest.groups[0].percentage / 100 - deviation,
        );
        expect(shareA).toBeLessThanOrEqual(experimentTest.groups[0].percentage / 100 + deviation);
        expect(shareB).toBeGreaterThanOrEqual(
            experimentTest.groups[1].percentage / 100 - deviation,
        );
        expect(shareB).toBeLessThanOrEqual(experimentTest.groups[1].percentage / 100 + deviation);
    });
});
