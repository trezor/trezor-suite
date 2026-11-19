import { type ReactElement } from 'react';

import { ExperimentId, ExperimentWrapper } from '@suite-common/message-system';

type AssetFirstHomeExperimentProps = {
    /** The page as it was: what a user outside the experiment, or in variant A, gets. */
    asItWas: ReactElement;
    /** The page as the asset-first Home has it: variant B. */
    assetFirst: ReactElement;
};

/** Switches a page on the asset-first Home experiment, so a page only names its two faces. */
export const AssetFirstHomeExperiment = ({
    asItWas,
    assetFirst,
}: AssetFirstHomeExperimentProps) => (
    <ExperimentWrapper
        id={ExperimentId.assetFirstHomeTable}
        components={[
            { variant: 'A', element: asItWas },
            { variant: 'B', element: assetFirst },
        ]}
    />
);
