import { type TxSimulationAction } from '@suite-common/wallet-types';

import { getTxSimulationParams } from './getTxSimulationParams';

const sourceOrigin = 'https://app.uniswap.org';
const fromAddress = '0x0000000000000000000000000000000000001234';

const createEvmAction = (chainId: number): TxSimulationAction => ({
    method: 'ethereumSignTransaction',
    fromAddress,
    sourceOrigin,
    payload: {
        path: "m/44'/60'/0'/0/0",
        transaction: {
            to: '0x000000000000000000000000000000000000abcd',
            value: '0x0',
            data: '0x',
            chainId,
            nonce: '0',
            gasLimit: '0x0',
            gasPrice: '0x0',
        },
    },
});

describe('getTxSimulationParams', () => {
    it('returns null without an action', () => {
        expect(getTxSimulationParams(null)).toBeNull();
    });

    it('resolves the Blockaid chain name from the EVM chainId', () => {
        expect(getTxSimulationParams(createEvmAction(999))?.params).toMatchObject({
            chain: 'hyperevm',
            account_address: fromAddress,
        });
    });

    it('returns null for an EVM chain Blockaid cannot scan', () => {
        expect(getTxSimulationParams(createEvmAction(61))).toBeNull();
    });
});
