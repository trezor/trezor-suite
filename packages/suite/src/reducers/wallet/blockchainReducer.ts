import { BlockchainNetworks } from '@suite-common/wallet-types';
import { prepareBlockchainReducer } from '@suite-common/wallet-blockchain';
import { extraDependencies } from '../../support/extraDependecies';

export type BlockchainState = BlockchainNetworks;

const blockchainReducer = prepareBlockchainReducer(extraDependencies);
export default blockchainReducer;
