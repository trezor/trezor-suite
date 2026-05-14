import { type parseCertificate } from './x509certificate';

// Check that this certificate is a valid Trezor CA.
// KeyUsage must be present and allow certificate signing.
// BasicConstraints must be present, have the cA flag and a pathLenConstraint.
// Any unrecognized non-critical extension is allowed. Any unrecognized critical extension is disallowed.
export const validateCaCertExtensions = (
    cert: ReturnType<typeof parseCertificate>,
    pathLen: number,
) => {
    let hasKeyUsage,
        hasBasicConstraints = false;
    cert.tbsCertificate.extensions.forEach(ext => {
        if (ext.key === 'keyUsage') {
            if (ext.keyCertSign !== '1') {
                throw new Error(`CA keyCertSign not set`);
            }
            hasKeyUsage = true;
        } else if (ext.key === 'basicConstraints') {
            if (!ext.cA) {
                throw new Error(`CA basicConstraints.cA not set`);
            }
            if (typeof ext.pathLenConstraint != 'number') {
                throw new Error('CA basicConstraints.pathLenConstraint not set');
            }
            if (ext.pathLenConstraint < pathLen) {
                throw new Error('Issuer was not permitted to issue certificate');
            }
            hasBasicConstraints = true;
        } else if (ext.critical) {
            throw new Error(`Unknown critical extension ${ext.key} in CA certificate`);
        }
    });

    if (!hasKeyUsage || !hasBasicConstraints) {
        throw new Error(
            `CA missing extensions keyUsage: ${hasKeyUsage}, basicConstraints: ${hasBasicConstraints}`,
        );
    }
};
