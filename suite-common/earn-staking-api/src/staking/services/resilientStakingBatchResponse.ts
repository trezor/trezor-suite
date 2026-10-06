import { captureException, withScope } from '@sentry/core';
import { z } from 'zod';

import { stakingBatchResponse } from '../../api/schemas';
import type { StakingBatch, StakingBatchDataItem, StakingBatchErrorsItem } from '../../api/types';
import { EARN_API_BASE_URL } from '../../constants';

// Derived from the generated schema rather than restated, so a regenerated shape flows through.
const stakingBatchDataItem = stakingBatchResponse.shape.data.element;
const stakingBatchErrorsItem = stakingBatchResponse.shape.errors.element;

const symbolCarrier = z.object({ symbol: z.string() });

const getDroppedItemLabel = (item: unknown, index: number) =>
    symbolCarrier.safeParse(item).data?.symbol ?? `data[${index}]`;

const reportedDriftSignatures = new Set<string>();

const reportStakingBatchSchemaDrift = (labels: string[]) => {
    const signature = labels.join(', ');

    if (reportedDriftSignatures.has(signature)) return;

    reportedDriftSignatures.add(signature);

    withScope(scope => {
        scope.setTag('error.code', 'staking_batch_schema_drift');
        scope.setTag('error.source', EARN_API_BASE_URL);
        scope.setTag('error.service', 'staking_batch');
        captureException(
            new Error(`Staking batch entries no longer match the generated schemas: ${signature}`),
        );
    });
};

export const resilientStakingBatchResponse = stakingBatchResponse
    .extend({
        data: z.array(z.unknown()),
        // An error code the generated enum does not know yet must not fail the whole batch either.
        errors: z.array(
            stakingBatchErrorsItem.catch(({ value }) => ({
                code: 'upstream_unknown_error' as const,
                message: `Unrecognized error entry: ${JSON.stringify(value)}`,
            })),
        ),
    })
    .transform(({ data, errors }): StakingBatch => {
        const parsedData: StakingBatchDataItem[] = [];
        const droppedLabels: string[] = [];

        data.forEach((item, index) => {
            const result = stakingBatchDataItem.safeParse(item);

            if (result.success) {
                parsedData.push(result.data);
            } else {
                droppedLabels.push(getDroppedItemLabel(item, index));
            }
        });

        if (droppedLabels.length) {
            reportStakingBatchSchemaDrift(droppedLabels);
        }

        const validationErrors: StakingBatchErrorsItem[] = droppedLabels.map(label => ({
            code: 'upstream_validation_error',
            message: `Suite schema mismatch, dropped ${label}`,
        }));

        return { data: parsedData, errors: [...errors, ...validationErrors] };
    });
