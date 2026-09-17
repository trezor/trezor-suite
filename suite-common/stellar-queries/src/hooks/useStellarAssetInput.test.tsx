/**
 * @jest-environment jsdom
 */
import { type QueryClient, commonQueryKeys } from '@suite-common/react-query';
import { newTestQueryClient, renderHookWithQueryClient, waitFor } from '@suite-common/test-utils';
import { resolveStellarContractId } from '@suite-common/wallet-utils';

import { type StellarAssetValidators } from '../queries';
import { useStellarAssetInput } from './useStellarAssetInput';

jest.mock('@suite-common/wallet-utils', () => ({
    ...jest.requireActual('@suite-common/wallet-utils'),
    resolveStellarContractId: jest.fn(),
    lazyStellarTokenMetadata: { getOrInit: () => Promise.resolve({}) },
}));

const mockedResolveStellarContractId = jest.mocked(resolveStellarContractId);

const CONTRACT_ID = 'CONTRACT_ID';
const USDC_ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

// Stands in for the lazily imported runtime; the hook must not carry any notion of the formats.
const validators: StellarAssetValidators = {
    isValidAssetCode: value => value === 'USDC',
    isValidAddress: value => value === USDC_ISSUER,
    isValidContractId: value => value === CONTRACT_ID,
};

const renderWithRuntime = (value: string, queryClient: QueryClient = newTestQueryClient()) => {
    queryClient.setQueryData(commonQueryKeys.stellarRuntime(), validators);

    return renderHookWithQueryClient(() => useStellarAssetInput(value), { queryClient });
};

describe(useStellarAssetInput.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('accepts an asset code without looking anything up', () => {
        const { result } = renderWithRuntime('USDC');

        expect(result.current.isAssetCodeValid).toBe(true);
        expect(result.current.isContractId).toBe(false);
        expect(result.current.isUnknownContractId).toBe(false);
        expect(mockedResolveStellarContractId).not.toHaveBeenCalled();
    });

    it('resolves a contract id to the classic asset it wraps', async () => {
        mockedResolveStellarContractId.mockResolvedValue({
            assetCode: 'USDC',
            assetIssuer: USDC_ISSUER,
        });

        const { result } = renderWithRuntime(CONTRACT_ID);

        expect(result.current.isContractId).toBe(true);

        await waitFor(() =>
            expect(result.current.resolvedAsset).toEqual({
                assetCode: 'USDC',
                assetIssuer: USDC_ISSUER,
            }),
        );
        expect(result.current.isUnknownContractId).toBe(false);
    });

    it('reports a contract id the definitions do not wrap', async () => {
        mockedResolveStellarContractId.mockResolvedValue(undefined);

        const { result } = renderWithRuntime(CONTRACT_ID);

        await waitFor(() => expect(result.current.isUnknownContractId).toBe(true));
        expect(result.current.resolvedAsset).toBeUndefined();
    });

    it('reports a lookup that failed the same way, rather than as a silent nothing', async () => {
        mockedResolveStellarContractId.mockRejectedValue(new Error('definitions unreachable'));

        const { result } = renderWithRuntime(CONTRACT_ID);

        await waitFor(() => expect(result.current.isUnknownContractId).toBe(true));
    });

    it('judges nothing until the runtime is in', () => {
        const { result } = renderHookWithQueryClient(() => useStellarAssetInput('USDC'));

        expect(result.current.isLoading).toBe(true);
        expect(result.current.isAssetCodeValid).toBe(false);
        expect(result.current.isContractId).toBe(false);
    });
});
