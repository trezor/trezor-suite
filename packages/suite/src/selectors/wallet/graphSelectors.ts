import { type GraphRootState } from '#src/types/wallet/graph';

export const selectGraph = (state: GraphRootState) => state.wallet.graph;
export const selectGraphSelectedRange = (state: GraphRootState) => state.wallet.graph.selectedRange;
