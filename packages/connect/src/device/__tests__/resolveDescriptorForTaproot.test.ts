import { resolveDescriptorForTaproot } from '../resolveDescriptorForTaproot';
import { HDNodeResponse } from '../../types/api/getPublicKey';
import { MessagesSchema as Messages } from '@trezor/protobuf';

const originalResponse: HDNodeResponse = {
    path: [2147483734, 2147483648, 2147483648],
    serializedPath: "m/86'/0'/0'",
    childNum: 2147483648,
    xpub: 'xpub6CXYpDGLuWpjqFXRTbo8LMYVsiiRjwWiDY7iwDkq1mk4GDYE7TWmSBCnNmbcVYQK4T56RZRRwhCAG7ucTBHAG2rhWHpXdMQtkZVDeVuv33p',
    chainCode: '9c35b0fa3e5c4a972fb7f45d8b5eb35819a4f10c30f8893a5ae373212bebe36d',
    publicKey: '0349ef2fb24926afb58adf0a405ad74dd19e766485b19044477bbb067deff2ce64',
    fingerprint: 1998437481,
    depth: 3,
};

const publicKey: Messages.PublicKey = {
    node: {
        depth: 3,
        fingerprint: 1998437481,
        child_num: 2147483648,
        chain_code: '9c35b0fa3e5c4a972fb7f45d8b5eb35819a4f10c30f8893a5ae373212bebe36d',
        private_key: undefined,
        public_key: '0349ef2fb24926afb58adf0a405ad74dd19e766485b19044477bbb067deff2ce64',
    },
    xpub: 'xpub6CXYpDGLuWpjqFXRTbo8LMYVsiiRjwWiDY7iwDkq1mk4GDYE7TWmSBCnNmbcVYQK4T56RZRRwhCAG7ucTBHAG2rhWHpXdMQtkZVDeVuv33p',
    root_fingerprint: 1910082563,
    descriptor:
        'tr([71d98c03/86h/0h/0h]xpub6CXYpDGLuWpjqFXRTbo8LMYVsiiRjwWiDY7iwDkq1mk4GDYE7TWmSBCnNmbcVYQK4T56RZRRwhCAG7ucTBHAG2rhWHpXdMQtkZVDeVuv33p/<0;1>/*)#gvfjd7ak',
};

describe(resolveDescriptorForTaproot.name, () => {
    it('separates the checksum from the descriptor', () => {
        const response = resolveDescriptorForTaproot({ response: originalResponse, publicKey });

        expect(response).toEqual({
            checksum: 'gvfjd7ak',
            xpub: "tr([71d98c03/86'/0'/0']xpub6CXYpDGLuWpjqFXRTbo8LMYVsiiRjwWiDY7iwDkq1mk4GDYE7TWmSBCnNmbcVYQK4T56RZRRwhCAG7ucTBHAG2rhWHpXdMQtkZVDeVuv33p/<0;1>/*)",
        });
    });

    it('calculates the descriptor for old firmware, when the descriptor is missing, checksum is then not provided', () => {
        const publicKeyWithoutDescriptor = { ...publicKey, descriptor: undefined };

        const response = resolveDescriptorForTaproot({
            response: originalResponse,
            publicKey: publicKeyWithoutDescriptor,
        });

        expect(response).toEqual({
            checksum: undefined,
            xpub: "tr([71d98c03/86'/0'/0']xpub6CXYpDGLuWpjqFXRTbo8LMYVsiiRjwWiDY7iwDkq1mk4GDYE7TWmSBCnNmbcVYQK4T56RZRRwhCAG7ucTBHAG2rhWHpXdMQtkZVDeVuv33p/<0;1>/*)",
        });
    });

    it('wont break when taproot xpub ends with "h" before the end', () => {
        const response = resolveDescriptorForTaproot({
            response: originalResponse,
            publicKey: {
                ...publicKey,

                // This breaks the `publicKey` data-object integrity, but for this test its fine
                descriptor:
                    // ............................................... There is this "h" at the end before "/" which may break the "h" to "'" replacement ⬎
                    'tr([71d98c03/86h/0h/0h]xpub6CXYpDGLuWpjqFXRTbo8LMYVsiiRjwWiDY7iwDkq1mk4GDYE7TWmSBCnNmbcVYQK4T56RZRRwhCAG7ucTBHAG2rhWHpXdMQtkZVDeVuv33h/<0;1>/*)#gvfjd7ak',
            },
        });

        expect(response).toEqual({
            checksum: 'gvfjd7ak',
            xpub: "tr([71d98c03/86'/0'/0']xpub6CXYpDGLuWpjqFXRTbo8LMYVsiiRjwWiDY7iwDkq1mk4GDYE7TWmSBCnNmbcVYQK4T56RZRRwhCAG7ucTBHAG2rhWHpXdMQtkZVDeVuv33h/<0;1>/*)",
        });
    });

    it("work for descriptor in non-extended version. The checksum won't be shown tho.", () => {
        const response = resolveDescriptorForTaproot({
            response: originalResponse,
            publicKey: {
                ...publicKey,

                // descriptor is xpub in non-extended form
                descriptor:
                    'xpub6CXYpDGLuWpjqFXRTbo8LMYVsiiRjwWiDY7iwDkq1mk4GDYE7TWmSBCnNmbcVYQK4T56RZRRwhCAG7ucTBHAG2rhWHpXdMQtkZVDeVuv33p',
            },
        });

        expect(response).toEqual({
            checksum: undefined, // code is defensive, it will work but it wont provide checksum
            xpub: "tr([71d98c03/86'/0'/0']xpub6CXYpDGLuWpjqFXRTbo8LMYVsiiRjwWiDY7iwDkq1mk4GDYE7TWmSBCnNmbcVYQK4T56RZRRwhCAG7ucTBHAG2rhWHpXdMQtkZVDeVuv33p/<0;1>/*)",
        });
    });
});
