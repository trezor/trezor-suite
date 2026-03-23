import type z from 'zod';

import { type CardanoValidatorStatsItem } from '../schemas';

type CardanoValidatorStatsItem = z.infer<typeof CardanoValidatorStatsItem>;

export type CardanoPoolStats = {
    apy: CardanoValidatorStatsItem['apy']['value'];
    saturation: CardanoValidatorStatsItem['saturation'];
    id: CardanoValidatorStatsItem['validator_address'];
};

export type CardanoPoolsStats = {
    pools: CardanoPoolStats[];
};
