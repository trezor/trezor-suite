import { type EthOrSolStats } from '../../api/types';

export type EthPoolStats = Omit<Extract<EthOrSolStats, { symbol: 'eth' }>, 'symbol'>;

export type SolChainStats = Omit<Extract<EthOrSolStats, { symbol: 'sol' }>, 'symbol'>;
