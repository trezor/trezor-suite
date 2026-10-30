import { selectWalletAssetKey } from '@suite-common/assets';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId } from '@trezor/device-utils';

import { type AppState } from 'src/reducers/store';

import { selectWalletAssetExplorerUrl } from './assetDetailMenuSelectors';
import { mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

const DEVICE_STATE = '1stTestnetAddress@device_id:0' as StaticSessionId;

const BTC = asNetworkSymbol('btc');
const ETH = asNetworkSymbol('eth');
const ADA = asNetworkSymbol('ada');
const DSOL = asNetworkSymbol('dsol');

const USDC_ON_ETH = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
const HOSKY_POLICY_ID = 'a0028f350aaabe0545fdcb56b039bfb08e4bb4d8c4d7c3c7d481c235';
const HOSKY_ON_ADA = `${HOSKY_POLICY_ID}484f534b59` as TokenAddress;
const HOSKY_FINGERPRINT = 'asset17q7r59zlc3dgw0venc80pdv566q6yguw03f0d9';

const state: AppState = {
    ...mockInitialAppState,
    networks: mockNetworksState([BTC, ETH, ADA, DSOL]),
    device: {
        ...mockInitialAppState.device,
        selectedDevice: mockSuiteDevice({ state: { staticSessionId: DEVICE_STATE } }),
    },
    wallet: {
        ...mockInitialAppState.wallet,
        accounts: [
            mockWalletAccount({ symbol: BTC, formattedBalance: '0.1' }),
            mockWalletAccount({
                symbol: ETH,
                formattedBalance: '2',
                tokens: [mockAccountToken({ contract: USDC_ON_ETH, balance: '10' })],
            }),
            mockWalletAccount({
                symbol: ADA,
                formattedBalance: '100',
                tokens: [
                    mockAccountToken({
                        contract: HOSKY_ON_ADA,
                        balance: '1000',
                        policyId: HOSKY_POLICY_ID,
                        fingerprint: HOSKY_FINGERPRINT,
                    }),
                ],
            }),
            mockWalletAccount({ symbol: DSOL, formattedBalance: '3' }),
        ],
        settings: {
            ...mockInitialAppState.wallet.settings,
            enabledNetworks: [BTC, ETH, ADA, DSOL],
        },
    },
};

const getExplorerUrl = (symbol: NetworkSymbol, contractAddress?: TokenAddress) =>
    selectWalletAssetExplorerUrl(state, selectWalletAssetKey(state, symbol, contractAddress));

describe('selectWalletAssetExplorerUrl', () => {
    it('opens the explorer home page for a coin', () => {
        expect(getExplorerUrl(BTC)).toBe('https://mempool.space');
    });

    it('opens the contract of an EVM token', () => {
        expect(getExplorerUrl(ETH, USDC_ON_ETH)).toBe(
            `https://etherscan.io/address/${USDC_ON_ETH}`,
        );
    });

    it('opens a Cardano token by its fingerprint', () => {
        expect(getExplorerUrl(ADA, HOSKY_ON_ADA)).toBe(
            `https://cexplorer.io/asset/${HOSKY_FINGERPRINT}`,
        );
    });

    it('keeps the explorer query, which picks the Solana cluster', () => {
        expect(getExplorerUrl(DSOL)).toBe('https://solscan.io?cluster=devnet');
    });
});
