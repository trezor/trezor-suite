import { buildOutputDescriptor } from '../buildOutputDescriptor';

const XPUB =
    'xpub6DDUPHpUo4pcy43iJeZjbSVWGav1SMMmuWdMHiGtkK8rhKmfbomtkwW6GKs1GGAKehT6QRocrmda3WWxXawpjmwaUHfFRXuKrXSapdckEYF';

describe('utils/buildOutputDescriptor', () => {
    describe('passthrough', () => {
        it('returns descriptor as-is when provided', () => {
            // When a descriptor is passed in, the function immediately returns it as-is — no checksum validation, no parsing, nothing.
            const precomputed = 'wpkh([00000000/84h/0h/0]xpub.../<0;1>/*)#checksum';
            expect(buildOutputDescriptor({ account: 0, xpub: XPUB, descriptor: precomputed })).toBe(
                precomputed,
            );
        });
    });

    describe('script type inference from purpose', () => {
        it('infers SPENDADDRESS from purpose 44', () => {
            const result = buildOutputDescriptor({ account: 0, purpose: 44, xpub: XPUB });
            expect(result).toMatch(/^pkh\(/);
        });

        it('infers SPENDP2SHWITNESS from purpose 49', () => {
            const result = buildOutputDescriptor({ account: 0, purpose: 49, xpub: XPUB });
            expect(result).toMatch(/^sh\(wpkh\(/);
        });

        it('infers SPENDWITNESS from purpose 84', () => {
            const result = buildOutputDescriptor({ account: 0, purpose: 84, xpub: XPUB });
            expect(result).toMatch(/^wpkh\(/);
        });

        it('infers SPENDTAPROOT from purpose 86', () => {
            const result = buildOutputDescriptor({ account: 0, purpose: 86, xpub: XPUB });
            expect(result).toMatch(/^tr\(/);
        });
    });

    describe('purpose inference from scriptType', () => {
        it('defaults to SPENDADDRESS when neither purpose nor scriptType given', () => {
            const result = buildOutputDescriptor({ account: 0, xpub: XPUB });
            expect(result).toMatch(/^pkh\(/);
            expect(result).toContain('/44h/0h/0h');
        });

        it('infers purpose 49 from SPENDP2SHWITNESS', () => {
            const result = buildOutputDescriptor({
                account: 0,
                scriptType: 'SPENDP2SHWITNESS',
                xpub: XPUB,
            });
            expect(result).toContain('/49h/0h/0h');
        });

        it('infers purpose 84 from SPENDWITNESS', () => {
            const result = buildOutputDescriptor({
                account: 0,
                scriptType: 'SPENDWITNESS',
                xpub: XPUB,
            });
            expect(result).toContain('/84h/0h/0h');
        });
    });

    describe('path construction', () => {
        it('uses coin_type 0 for Bitcoin', () => {
            const result = buildOutputDescriptor({
                account: 0,
                coin: 'Bitcoin',
                scriptType: 'SPENDWITNESS',
                xpub: XPUB,
            });
            expect(result).toContain('/84h/0h/0h');
        });

        it('uses coin_type 1 for Testnet', () => {
            const result = buildOutputDescriptor({
                account: 0,
                coin: 'Testnet',
                scriptType: 'SPENDWITNESS',
                xpub: XPUB,
            });
            expect(result).toContain('/84h/1h/0h');
        });

        it('uses coin_type 1 for Regtest', () => {
            const result = buildOutputDescriptor({
                account: 0,
                coin: 'Regtest',
                scriptType: 'SPENDWITNESS',
                xpub: XPUB,
            });
            expect(result).toContain('/84h/1h/0h');
        });

        it('uses the correct account index', () => {
            const result = buildOutputDescriptor({
                account: 2,
                scriptType: 'SPENDWITNESS',
                xpub: XPUB,
            });
            expect(result).toContain('/84h/0h/2h');
        });

        it('encodes rootFingerprint as 8-char hex', () => {
            const result = buildOutputDescriptor({
                account: 0,
                scriptType: 'SPENDWITNESS',
                xpub: XPUB,
                rootFingerprint: 0xdeadbeef,
            });
            expect(result).toContain('[deadbeef/');
        });

        it('zero-pads rootFingerprint to 8 chars', () => {
            const result = buildOutputDescriptor({
                account: 0,
                scriptType: 'SPENDWITNESS',
                xpub: XPUB,
                rootFingerprint: 1,
            });
            expect(result).toContain('[00000001/');
        });

        it('defaults rootFingerprint to 00000000 when not provided', () => {
            const result = buildOutputDescriptor({
                account: 0,
                scriptType: 'SPENDWITNESS',
                xpub: XPUB,
            });
            expect(result).toContain('[00000000/');
        });
    });

    describe('SLIP25', () => {
        it('appends /1h for SLIP25 taproot', () => {
            const result = buildOutputDescriptor({
                account: 0,
                purpose: 10025,
                scriptType: 'SPENDTAPROOT',
                xpub: XPUB,
            });
            expect(result).toEqual(
                'tr([00000000/10025h/0h/0h/1h]xpub6DDUPHpUo4pcy43iJeZjbSVWGav1SMMmuWdMHiGtkK8rhKmfbomtkwW6GKs1GGAKehT6QRocrmda3WWxXawpjmwaUHfFRXuKrXSapdckEYF/<0;1>/*)#zqcxnytn',
            );
        });

        it('returns undefined for SLIP25 with non-taproot script type', () => {
            expect(
                buildOutputDescriptor({
                    account: 0,
                    purpose: 10025,
                    scriptType: 'SPENDWITNESS',
                    xpub: XPUB,
                }),
            ).toBeUndefined();
        });
    });

    describe('checksum', () => {
        it('appends a #checksum suffix', () => {
            const result = buildOutputDescriptor({
                account: 0,
                scriptType: 'SPENDWITNESS',
                xpub: XPUB,
            });
            expect(result).toMatch(/#[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{8}$/);
        });
    });

    describe('invalid inputs return undefined', () => {
        it('returns undefined for unsupported coin', () => {
            expect(
                buildOutputDescriptor({
                    account: 0,
                    coin: 'Ethereum',
                    scriptType: 'SPENDWITNESS',
                    xpub: XPUB,
                }),
            ).toBeUndefined();
        });

        it('returns undefined for unknown purpose', () => {
            expect(buildOutputDescriptor({ account: 0, purpose: 999, xpub: XPUB })).toBeUndefined();
        });

        it('returns undefined when purpose and scriptType are mismatched', () => {
            expect(
                buildOutputDescriptor({
                    account: 0,
                    purpose: 84,
                    scriptType: 'SPENDADDRESS',
                    xpub: XPUB,
                }),
            ).toBeUndefined();
        });
    });
});
