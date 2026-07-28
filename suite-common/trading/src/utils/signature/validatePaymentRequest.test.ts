import { createPublicKey, generateKeyPairSync, sign } from 'crypto';

import { type PROTO } from '@trezor/connect';

import {
    type Slip24Output,
    computePaymentRequestPayload,
    validatePaymentRequestSignature,
} from './validatePaymentRequest';

// Fixture taken from trezor-trade-api PaymentRequestSigner tests: the signature was
// produced by the API implementation with the debug key (m/0h of "all all ... all" seed),
// so this verifies both implementations compute the same SLIP-24 digest.
const fixtureSignature =
    '3d4828dd20272f1f10bd6aadaf7050eaf87fba2bd1418de8b320a9c4977c373926e7685ef520a2e9ec9d4bdd57845c673eba87c30e55e5e0aa68f1f55be53e32';

const createFixturePaymentRequest = (
    paymentRequest?: Partial<PROTO.PaymentRequest>,
): PROTO.PaymentRequest => ({
    recipient_name: 'Alice',
    nonce: 'nonce',
    memos: [
        {
            coin_purchase_memo: {
                coin_type: 0,
                amount: '1000 BTC',
                address: '1A2B3C',
                address_n: [0],
                mac: '00',
            },
        },
    ],
    signature: fixtureSignature,
    ...paymentRequest,
});

const fixtureSendSlip44 = 2;
const fixtureOutputs: Slip24Output[] = [{ address: '1A2B3C', amount: '1000' }];
const fixtureSentAsset = { network: 'btc', isToken: false };

describe(validatePaymentRequestSignature.name, () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    it('validates a signature created by the trade API', () => {
        const isValid = validatePaymentRequestSignature({
            paymentRequest: createFixturePaymentRequest(),
            sendSlip44: fixtureSendSlip44,
            outputs: fixtureOutputs,
        });

        expect(isValid).toBe(true);
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('rejects a payment request with tampered recipient name', () => {
        const isValid = validatePaymentRequestSignature({
            paymentRequest: createFixturePaymentRequest({ recipient_name: 'Mallory' }),
            sendSlip44: fixtureSendSlip44,
            outputs: fixtureOutputs,
            sentAsset: fixtureSentAsset,
        });

        expect(isValid).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'SLIP-24: Payment request signature does not match its content.',
            JSON.stringify(fixtureSentAsset),
        );
    });

    it('rejects a payment request with tampered memo amount', () => {
        const isValid = validatePaymentRequestSignature({
            paymentRequest: createFixturePaymentRequest({
                memos: [
                    {
                        coin_purchase_memo: {
                            coin_type: 0,
                            amount: '9000 BTC',
                            address: '1A2B3C',
                            address_n: [0],
                            mac: '00',
                        },
                    },
                ],
            }),
            sendSlip44: fixtureSendSlip44,
            outputs: fixtureOutputs,
        });

        expect(isValid).toBe(false);
    });

    it('rejects a payment request with tampered output address', () => {
        const isValid = validatePaymentRequestSignature({
            paymentRequest: createFixturePaymentRequest(),
            sendSlip44: fixtureSendSlip44,
            outputs: [{ address: 'mallory-address', amount: '1000' }],
        });

        expect(isValid).toBe(false);
    });

    it('rejects a payment request with tampered slip44', () => {
        const isValid = validatePaymentRequestSignature({
            paymentRequest: createFixturePaymentRequest(),
            sendSlip44: 60,
            outputs: fixtureOutputs,
        });

        expect(isValid).toBe(false);
    });

    it('verifies with the production public key being a valid P-256 key, no private key needed', () => {
        // Mirrors PRODUCTION_PUBLIC_KEY and the SPKI encoding in validatePaymentRequest.ts.
        // Guards against a typo in the constant silently hiding behind the debug key fallback.
        const productionPublicKey =
            '02aa9b94b306f1b50c19b4b953b6acdf2d3ac09eca5e5344a2bb2fbf19495d550c';
        const spkiPrefix = '3039301306072a8648ce3d020106082a8648ce3d030107032200';
        const pem = `-----BEGIN PUBLIC KEY-----\n${Buffer.from(
            spkiPrefix + productionPublicKey,
            'hex',
        ).toString('base64')}\n-----END PUBLIC KEY-----`;

        const publicKey = createPublicKey(pem);

        expect(publicKey.asymmetricKeyType).toBe('ec');
        expect(publicKey.asymmetricKeyDetails?.namedCurve).toBe('prime256v1');
    });

    it('rejects a well-formed signature created by an untrusted key', () => {
        // A valid P-256 signature from a key other than the trusted ones must be rejected.
        // Sign the exact payload that verification recomputes, so the only reason it fails is the
        // untrusted key. This genuinely guards the allowlist: adding this key to TRUSTED_PUBLIC_KEYS
        // would make the test pass.
        const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
        const payload = computePaymentRequestPayload({
            paymentRequest: createFixturePaymentRequest(),
            sendSlip44: fixtureSendSlip44,
            outputs: fixtureOutputs,
        });
        const untrustedSignature = sign('sha256', payload, {
            key: privateKey,
            dsaEncoding: 'ieee-p1363',
        });

        const isValid = validatePaymentRequestSignature({
            paymentRequest: createFixturePaymentRequest({
                signature: untrustedSignature.toString('hex'),
            }),
            sendSlip44: fixtureSendSlip44,
            outputs: fixtureOutputs,
            sentAsset: fixtureSentAsset,
        });

        expect(isValid).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'SLIP-24: Payment request signature does not match its content.',
            JSON.stringify(fixtureSentAsset),
        );
    });

    it('rejects a debug-key signature in production env', () => {
        // The fixture signature is created by the debug key, which is derivable from
        // the public test mnemonic and must only be trusted in dev builds.
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        try {
            jest.isolateModules(() => {
                const { validatePaymentRequestSignature: validateInProduction } =
                    jest.requireActual<{
                        validatePaymentRequestSignature: typeof validatePaymentRequestSignature;
                    }>('./validatePaymentRequest');

                const isValid = validateInProduction({
                    paymentRequest: createFixturePaymentRequest(),
                    sendSlip44: fixtureSendSlip44,
                    outputs: fixtureOutputs,
                });

                expect(isValid).toBe(false);
            });
        } finally {
            process.env.NODE_ENV = originalNodeEnv;
        }
    });

    it('rejects and logs a payment request with malformed signature', () => {
        const isValid = validatePaymentRequestSignature({
            paymentRequest: createFixturePaymentRequest({ signature: 'not-a-signature' }),
            sendSlip44: fixtureSendSlip44,
            outputs: fixtureOutputs,
        });

        expect(isValid).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalled();
    });
});
