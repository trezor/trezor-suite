import type { VerifiedNonceRequest } from '@suite/desktop-app-api';

import type { VerifiedAccountStateValue } from './accountState';
import {
    type SafeImplementationResolverDeps,
    createSafeImplementationResolver,
    getSafeImplementation,
} from './createSafeImplementationResolver';
import { createNonceFailure } from './errors';
import { SAFE_SINGLETON_STORAGE_SLOT } from './safeDeployments';
import { mockVerifiedAccountState } from '../mocks/mockVerifiedAccountState';

const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111';
const PROXY_1_3_0 = '0xb89c1b3bdf2cf8827818646bce9a8f6e372885f8c55e5c07acbd307cb133b000';
const PROXY_1_5_0 = '0x4e381985ca68b3e5d27b4425fa581c19cf33146d3f887a3cfca96f55528ea46f';
const SAFE_L2_1_3_0 = '0x3e5c63644e683549055b9be8653de26e0b4cd36e';
const SAFE_L2_1_5_0 = '0xedd160febbd92e350d4d398fb636302fccd67c7e';
// The 1.1.1 singleton: a real Safe, but not described by the ERC-7730 registry.
const SAFE_1_1_1 = '0x34cfac646f301356faa8b21e94227e3583fe3f5f';

const toSlotWord = (address: string) => `0x${'0'.repeat(24)}${address.slice(2)}`;

const mockState = (codeHash: string, slotValue?: string): VerifiedAccountStateValue => ({
    address: SAFE_ADDRESS,
    codeHash,
    storage:
        slotValue === undefined ? [] : [{ key: SAFE_SINGLETON_STORAGE_SLOT, value: slotValue }],
});

describe(getSafeImplementation.name, () => {
    it.each([
        ['1.3.0', PROXY_1_3_0, SAFE_L2_1_3_0, 'calldata-SafeL2-1.3.0.json'],
        ['1.5.0', PROXY_1_5_0, SAFE_L2_1_5_0, 'calldata-SafeL2-1.5.0.json'],
    ])(
        'resolves a %s proxy to the singleton in slot 0',
        (proxyVersion, codeHash, singletonAddress, erc7730Descriptor) => {
            expect(
                getSafeImplementation(mockState(codeHash, toSlotWord(singletonAddress))),
            ).toEqual({
                success: true,
                implementation: {
                    proxyVersion,
                    singleton: expect.objectContaining({
                        address: singletonAddress,
                        isL2: true,
                        erc7730Descriptor,
                    }),
                },
            });
        },
    );

    it('follows an upgraded proxy to its current singleton', () => {
        // A 1.3.0 proxy migrated to the 1.5.0 L2 singleton runs 1.5.0 code.
        expect(
            getSafeImplementation(mockState(PROXY_1_3_0, toSlotWord(SAFE_L2_1_5_0))),
        ).toMatchObject({
            success: true,
            implementation: { proxyVersion: '1.3.0', singleton: { version: '1.5.0' } },
        });
    });

    it('refuses an account whose code is not a canonical Safe proxy', () => {
        // Slot 0 pointing at a Safe singleton means nothing for arbitrary code.
        expect(
            getSafeImplementation(mockState(`0x${'12'.repeat(32)}`, toSlotWord(SAFE_L2_1_5_0))),
        ).toEqual({ success: false, code: 'NOT_A_SAFE_PROXY' });
    });

    it.each([
        ['missing', undefined],
        ['dirty in the upper 12 bytes', `0x${'0'.repeat(23)}1${SAFE_L2_1_5_0.slice(2)}`],
        ['not a full word', '0x00000000'],
    ])('refuses a slot 0 that is %s', (_name, slotValue) => {
        expect(getSafeImplementation(mockState(PROXY_1_5_0, slotValue))).toEqual({
            success: false,
            code: 'MALFORMED_SINGLETON_SLOT',
        });
    });

    it.each([
        ['the 1.1.1 singleton', SAFE_1_1_1],
        ['an unknown contract', '0x2222222222222222222222222222222222222222'],
        ['the zero address', `0x${'0'.repeat(40)}`],
    ])('refuses a proxy pointing at %s', (_name, singletonAddress) => {
        expect(getSafeImplementation(mockState(PROXY_1_5_0, toSlotWord(singletonAddress)))).toEqual(
            { success: false, code: 'UNSUPPORTED_SINGLETON' },
        );
    });
});

describe(createSafeImplementationResolver.name, () => {
    const request: VerifiedNonceRequest = {
        requestId: 'req-1',
        chainId: '1',
        address: SAFE_ADDRESS,
    };

    it('proves slot 0 and keys the definitions by the singleton', async () => {
        const accountState = mockVerifiedAccountState({
            codeHash: PROXY_1_5_0,
            storage: [{ key: SAFE_SINGLETON_STORAGE_SLOT, value: toSlotWord(SAFE_L2_1_5_0) }],
        });
        const deps: SafeImplementationResolverDeps = {
            verifyAccountState: jest.fn().mockResolvedValue(accountState),
        };
        const { signal } = new AbortController();

        const result = await createSafeImplementationResolver(deps)(request, signal);

        expect(deps.verifyAccountState).toHaveBeenCalledWith(
            { ...request, storageKeys: [SAFE_SINGLETON_STORAGE_SLOT] },
            signal,
        );
        expect(result).toEqual({
            status: 'resolved',
            requestId: 'req-1',
            address: SAFE_ADDRESS,
            definitionsContractAddress: SAFE_L2_1_5_0,
            implementation: {
                proxyVersion: '1.5.0',
                singleton: {
                    address: SAFE_L2_1_5_0,
                    version: '1.5.0',
                    isL2: true,
                    erc7730Descriptor: 'calldata-SafeL2-1.5.0.json',
                },
            },
            accountState,
        });
    });

    it('passes a verification failure through unchanged', async () => {
        const failure = createNonceFailure('req-1', 'STALE_PROOF');
        const deps: SafeImplementationResolverDeps = {
            verifyAccountState: jest.fn().mockResolvedValue(failure),
        };

        expect(await createSafeImplementationResolver(deps)(request)).toBe(failure);
    });

    it('reports a verified account that is not a supported Safe as final', async () => {
        const deps: SafeImplementationResolverDeps = {
            verifyAccountState: jest
                .fn()
                .mockResolvedValue(mockVerifiedAccountState({ codeHash: `0x${'12'.repeat(32)}` })),
        };

        expect(await createSafeImplementationResolver(deps)(request)).toEqual({
            status: 'failed',
            requestId: 'req-1',
            code: 'NOT_A_SAFE_PROXY',
            retryable: false,
        });
    });
});
