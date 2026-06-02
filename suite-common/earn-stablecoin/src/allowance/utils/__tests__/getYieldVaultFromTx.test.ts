import { Calldata } from '@suite-common/calldata';
import { type YieldDto } from '@suite-common/earn-stablecoin-api';
import { BigNumber } from '@trezor/utils';

import { getYieldVaultFromTx } from '../getYieldVaultFromTx';

const VAULT_ADDRESS = '0xe4db1c5a1b709ce4d2ada6985d9d506e58f73829';
const OTHER_VAULT_ADDRESS = '0xde6c23e561f3e55846207ec45a91b777e0f7c889';
const TOKEN_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const RECEIVER = '0x1111111111111111111111111111111111111111';

const createVault = (address: string): YieldDto =>
    ({
        id: `ethereum-usdt-steakusdt-${address}-third-party-oav`,
        outputToken: { address } as YieldDto['outputToken'],
    }) as YieldDto;

const vaults = [createVault(VAULT_ADDRESS), createVault(OTHER_VAULT_ADDRESS)];

const dataOf = (result: { data: string | null; isValid: boolean }): string => {
    if (!result.isValid || !result.data) {
        throw new Error('failed to encode test calldata');
    }

    return result.data;
};

const approveData = (spender: string, amount: number) =>
    dataOf(Calldata.evm.erc20.approve.encode({ spender, amount: new BigNumber(amount) }));

describe('getYieldVaultFromTx', () => {
    it('matches a deposit by the call target (tx.to)', () => {
        const data = dataOf(
            Calldata.evm.erc4626.deposit.encode({
                assets: new BigNumber(1000),
                receiver: RECEIVER,
            }),
        );

        expect(getYieldVaultFromTx({ to: VAULT_ADDRESS, data }, vaults)).toBe(vaults[0]);
    });

    it('matches a withdraw by the call target (tx.to)', () => {
        const data = dataOf(
            Calldata.evm.erc4626.withdraw.encode({
                assets: new BigNumber(1000),
                receiver: RECEIVER,
                owner: RECEIVER,
            }),
        );

        expect(getYieldVaultFromTx({ to: OTHER_VAULT_ADDRESS, data }, vaults)).toBe(vaults[1]);
    });

    it('matches a redeem by the call target (tx.to)', () => {
        const data = dataOf(
            Calldata.evm.erc4626.redeem.encode({
                shares: new BigNumber(1000),
                receiver: RECEIVER,
                owner: RECEIVER,
            }),
        );

        expect(getYieldVaultFromTx({ to: VAULT_ADDRESS, data }, vaults)).toBe(vaults[0]);
    });

    it('matches an approve by the decoded spender, ignoring tx.to (the token contract)', () => {
        const data = approveData(VAULT_ADDRESS, 1);

        expect(getYieldVaultFromTx({ to: TOKEN_ADDRESS, data }, vaults)).toBe(vaults[0]);
    });

    it('matches a revoke (approve amount 0) by the decoded spender', () => {
        const data = approveData(OTHER_VAULT_ADDRESS, 0);

        expect(getYieldVaultFromTx({ to: TOKEN_ADDRESS, data }, vaults)).toBe(vaults[1]);
    });

    it('matches case-insensitively when the registry address is not lower-case', () => {
        const upperCaseVault = createVault(`0x${VAULT_ADDRESS.slice(2).toUpperCase()}`);
        const data = approveData(VAULT_ADDRESS, 1);

        expect(getYieldVaultFromTx({ to: TOKEN_ADDRESS, data }, [upperCaseVault])).toBe(
            upperCaseVault,
        );
    });

    it('returns undefined when the address is not a known vault', () => {
        const data = approveData(TOKEN_ADDRESS, 1);

        expect(getYieldVaultFromTx({ to: TOKEN_ADDRESS, data }, vaults)).toBeUndefined();
    });

    it('returns undefined for a plain transfer / unknown / empty calldata', () => {
        const transferData = dataOf(
            Calldata.evm.erc20.transfer.encode({ to: VAULT_ADDRESS, amount: new BigNumber(1) }),
        );

        expect(
            getYieldVaultFromTx({ to: VAULT_ADDRESS, data: transferData }, vaults),
        ).toBeUndefined();
        expect(
            getYieldVaultFromTx({ to: VAULT_ADDRESS, data: '0xdeadbeef' }, vaults),
        ).toBeUndefined();
        expect(getYieldVaultFromTx({ to: VAULT_ADDRESS, data: undefined }, vaults)).toBeUndefined();
    });
});
