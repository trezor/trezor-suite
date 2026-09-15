import { getStellarTokenLogoAddresses } from './getStellarTokenLogoAddresses';

it('resolves the Soroban alternative lazily and reuses the loaded runtime', async () => {
    const contract = 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
    const expected = [contract, 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75'];
    const cold = getStellarTokenLogoAddresses(contract);
    expect(cold).toBeInstanceOf(Promise);
    await expect(cold).resolves.toEqual(expected);
    expect(getStellarTokenLogoAddresses(contract)).toEqual(expected);
});

it('retains the original address when a Soroban alternative cannot be derived', async () => {
    await expect(Promise.resolve(getStellarTokenLogoAddresses('malformed'))).resolves.toEqual([
        'malformed',
    ]);
});
