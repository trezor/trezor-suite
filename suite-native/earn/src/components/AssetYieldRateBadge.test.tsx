import { type YieldDtoV2, useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { messageSystemInitialState } from '@suite-common/message-system';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { mockYieldVault } from '@suite-common/wallet-core/mocks';
import { renderWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { getWrappedNativeToken } from '@trezor/network-ethereum/constants';

import { AssetYieldRateBadge } from './AssetYieldRateBadge';
import { useMessageSystemStaking } from '../hooks/useMessageSystemStaking';
import { useMessageSystemYield } from '../hooks/useMessageSystemYield';
import { useStakingRate } from '../hooks/useStakingRate';

jest.mock('@suite-common/earn-stablecoin-api', () => ({
    ...jest.requireActual('@suite-common/earn-stablecoin-api'),
    useAllYieldOpportunities: jest.fn(),
}));
jest.mock('../hooks/useStakingRate');
jest.mock('../hooks/useMessageSystemYield');
jest.mock('../hooks/useMessageSystemStaking');

const mockUseAllYieldOpportunities = jest.mocked(useAllYieldOpportunities);
const mockUseStakingRate = jest.mocked(useStakingRate);
const mockUseMessageSystemYield = jest.mocked(useMessageSystemYield);
const mockUseMessageSystemStaking = jest.mocked(useMessageSystemStaking);

const BTC = asNetworkSymbol('btc');
const ETH = asNetworkSymbol('eth');
const TRX = asNetworkSymbol('trx');

const USDC_ON_ETH = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const BADGE = '@earn/asset-yield-rate-badge';

type MockVaultParams = {
    id: string;
    token: Pick<YieldDtoV2['token'], 'address' | 'symbol' | 'decimals'>;
    /** As a percentage, the way the badge shows it. */
    apy: number;
};

/** An open vault on Ethereum that takes the token and pays `apy`. */
const mockVault = ({ id, token, apy }: MockVaultParams): YieldDtoV2 => {
    const vault = mockYieldVault();

    return mockYieldVault({
        id,
        token: { ...vault.token, ...token },
        rewardRate: { ...vault.rewardRate, total: apy / 100 },
    });
};

const wethVault = mockVault({ id: 'weth-vault', token: getWrappedNativeToken('eth'), apy: 4 });
const usdcVault = mockVault({
    id: 'usdc-vault',
    token: { address: USDC_ON_ETH, symbol: 'USDC', decimals: 6 },
    apy: 4.5,
});

const vaultsQuery = (vaults?: YieldDtoV2[]) =>
    ({ data: vaults }) as ReturnType<typeof useAllYieldOpportunities>;

type MockEarnParams = {
    stakingRates?: Partial<Record<NetworkSymbol, number>>;
    vaults?: YieldDtoV2[];
    areYieldDepositsOff?: boolean;
    isStakingOff?: boolean;
};

const mockEarn = ({
    stakingRates = {},
    vaults,
    areYieldDepositsOff = false,
    isStakingOff = false,
}: MockEarnParams) => {
    mockUseStakingRate.mockImplementation(({ symbol }) => ({
        rate: (symbol && stakingRates[symbol]) ?? null,
    }));
    mockUseAllYieldOpportunities.mockReturnValue(vaultsQuery(vaults));
    mockUseMessageSystemYield.mockReturnValue({
        isDisabled: areYieldDepositsOff,
    } as ReturnType<typeof useMessageSystemYield>);
    mockUseMessageSystemStaking.mockReturnValue({
        isStakingDisabled: isStakingOff,
    } as ReturnType<typeof useMessageSystemStaking>);
};

const preloadedState = { messageSystem: messageSystemInitialState };

const renderCoinBadge = (networkSymbol: NetworkSymbol) =>
    renderWithStoreProvider(<AssetYieldRateBadge networkSymbol={networkSymbol} />, {
        preloadedState,
    });

const renderUsdcBadge = () =>
    renderWithStoreProvider(
        <AssetYieldRateBadge
            networkSymbol={ETH}
            contractAddress={USDC_ON_ETH}
            tokenSymbol="USDC"
            tokenDecimals={6}
        />,
        { preloadedState },
    );

describe('AssetYieldRateBadge', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('offers a coin its staking rate, and nothing to what cannot earn', async () => {
        mockEarn({ stakingRates: { [ETH]: 3.2 } });

        await renderCoinBadge(ETH);
        expect(screen.getByText('up to 3.2% APY')).toBeTruthy();

        await renderUsdcBadge();
        expect(screen.queryByTestId(BADGE)).toBeNull();

        await renderCoinBadge(BTC);
        expect(screen.queryByTestId(BADGE)).toBeNull();
    });

    it('offers a coin the better of staking and its wrapped-coin vault, and a token its vault', async () => {
        mockEarn({ stakingRates: { [ETH]: 3.2 }, vaults: [wethVault, usdcVault] });

        await renderCoinBadge(ETH);
        expect(screen.getByText('up to 4% APY')).toBeTruthy();

        await renderUsdcBadge();
        expect(screen.getByText('up to 4.5% APY')).toBeTruthy();
    });

    it('leaves the vaults out while yield deposits are switched off, and staking in', async () => {
        mockEarn({
            stakingRates: { [ETH]: 3.2 },
            vaults: [wethVault, usdcVault],
            areYieldDepositsOff: true,
        });

        await renderCoinBadge(ETH);
        expect(screen.getByText('up to 3.2% APY')).toBeTruthy();

        await renderUsdcBadge();
        expect(screen.queryByTestId(BADGE)).toBeNull();

        expect(mockUseAllYieldOpportunities).not.toHaveBeenCalledWith(
            expect.objectContaining({ enabled: true }),
        );
    });

    it('leaves staking out while it is switched off, and the vault in', async () => {
        mockEarn({ stakingRates: { [ETH]: 5 }, vaults: [wethVault], isStakingOff: true });

        await renderCoinBadge(ETH);

        expect(screen.getByText('up to 4% APY')).toBeTruthy();
    });

    it('calls the Tron staking rate an APR', async () => {
        mockEarn({ stakingRates: { [TRX]: 3.27 } });

        await renderCoinBadge(TRX);

        expect(screen.getByText('up to 3.27% APR')).toBeTruthy();
    });

    it('offers a token whose decimals are unknown its vault, matched by address', async () => {
        mockEarn({ stakingRates: { [ETH]: 3.2 }, vaults: [wethVault, usdcVault] });

        await renderWithStoreProvider(
            <AssetYieldRateBadge networkSymbol={ETH} contractAddress={USDC_ON_ETH} />,
            { preloadedState },
        );

        expect(screen.getByText('up to 4.5% APY')).toBeTruthy();
    });
});
