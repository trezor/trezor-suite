import { getBuiltInDisplayFormat } from './ethereumBuiltInDisplayFormats';

const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const WBNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
const ANY_TOKEN = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const WITHDRAW = '0x2e1a7d4d';

describe(getBuiltInDisplayFormat.name, () => {
    it.each([
        ['approve', '0x095ea7b3', 'Approve'],
        ['transfer', 'a9059cbb', 'Send'],
    ])('knows ERC-20 %s on any contract', (_name, functionSignature, intent) => {
        expect(
            getBuiltInDisplayFormat({ chainId: 137, address: ANY_TOKEN, functionSignature }),
        ).toMatchObject({ intent });
    });

    it('knows WETH withdraw on the WETH deployments the firmware lists', () => {
        expect(
            getBuiltInDisplayFormat({ chainId: 1, address: WETH, functionSignature: WITHDRAW }),
        ).toMatchObject({ intent: 'Unwrap WETH to ETH' });
        expect(
            getBuiltInDisplayFormat({
                chainId: 1,
                address: WETH.slice(2).toLowerCase(),
                functionSignature: WITHDRAW.slice(2),
            }),
        ).toMatchObject({ intent: 'Unwrap WETH to ETH' });
    });

    it.each([
        ['the WETH address on another chain', 137, WETH],
        ['another wrapped native token', 56, WBNB],
    ])('does not know WETH withdraw on %s', (_name, chainId, address) => {
        expect(
            getBuiltInDisplayFormat({ chainId, address, functionSignature: WITHDRAW }),
        ).toBeUndefined();
    });
});
