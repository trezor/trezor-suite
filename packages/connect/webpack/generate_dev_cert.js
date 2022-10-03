const selfsigned = require('selfsigned');
const path = require('path');
const fs = require('fs');

const crtPath = path.join(__dirname, 'connect_dev.crt');
const keyPath = path.join(__dirname, 'connect_dev.key');

if (!fs.existsSync(crtPath) || !fs.existsSync(keyPath)) {
    const pems = selfsigned.generate(
        [
            { name: 'commonName', value: 'localhost' },
            { name: 'organizationName', value: 'INSECURE AUTHORITY' },
            { name: 'organizationalUnitName', value: 'DEVELOPMENT' },
        ],
        {
            keySize: 4096,
            days: 3650,
            algorithm: 'sha256',
            extensions: [
                {
                    name: 'keyUsage',
                    critical: true,
                    keyCertSign: true,
                    digitalSignature: true,
                    nonRepudiation: true,
                    keyEncipherment: true,
                    dataEncipherment: true,
                },
                { name: 'extKeyUsage', critical: false, serverAuth: true },
                { name: 'basicConstraints', critical: true, cA: true, pathLenConstraint: 0 },
                {
                    name: 'subjectAltName',
                    critical: false,
                    altNames: [{ type: 2 /* DNS */, value: 'localhost' }],
                },
            ],
        },
    );
    fs.writeFileSync(crtPath, pems.cert, { encoding: 'utf8' });
    fs.writeFileSync(keyPath, pems.private, { encoding: 'utf8' });
    console.log('new key and crt files generated');
} else {
    console.log('key and crt files exist');
}
