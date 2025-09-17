/**
 * Module used by `authenticateDevice` method.
 *
 * Parse x509 certificate returned from Trezor (PROTO.AuthenticityProof) from DER format.
 * inspired by https://blog.engelke.com/2014/10/21/web-crypto-and-x-509-certificates/
 */

interface Asn1 {
    cls: number; // ASN.1 class of the object.
    tag: number; // ASN.1 object type.
    structured: boolean; // Structured objects are encoded ASN.1 objects. Other objects (primitive) values depends on the tag and class
    byteLength: number; // value size
    contents: Uint8Array; // byte array containing the object value.
    raw: Uint8Array; // original byte array
}

type Oid = `${number}.${number}.${number}.${number}`;

type Extension =
    | {
          key: 'keyUsage';
          critical?: boolean;
          keyCertSign: '0' | '1';
      }
    | {
          key: 'basicConstraints';
          critical?: boolean;
          cA: boolean;
          pathLenConstraint?: number;
      }
    | (Asn1 & {
          key: Oid;
          critical?: boolean;
      });

const derToAsn1 = (byteArray: Uint8Array): Asn1 => {
    let position = 0;

    function getTag() {
        let tag = byteArray[0] & 0x1f;
        position += 1;
        if (tag === 0x1f) {
            tag = 0;
            while (byteArray[position] >= 0x80) {
                tag = tag * 128 + byteArray[position] - 0x80;
                position += 1;
            }
            tag = tag * 128 + byteArray[position] - 0x80;
            position += 1;
        }

        return tag;
    }

    function getLength() {
        let length = 0;

        if (byteArray[position] < 0x80) {
            length = byteArray[position];
            position += 1;
        } else {
            const numberOfDigits = byteArray[position] & 0x7f;
            position += 1;
            length = 0;
            for (let i = 0; i < numberOfDigits; i++) {
                length = length * 256 + byteArray[position];
                position += 1;
            }
        }

        return length;
    }

    const cls = (byteArray[0] & 0xc0) / 64;
    const structured = (byteArray[0] & 0x20) === 0x20;
    const tag = getTag();

    if (byteArray[position] === 0x80) {
        // DER forbids indefinite length encoding. You must use the definite length encoding (that is, with the length specified at the beginning).
        // https://letsencrypt.org/docs/a-warm-welcome-to-asn1-and-der/
        throw new Error('Unsupported length encoding');
    }

    const length = getLength(); // As encoded, which may be special value 0
    const byteLength = position + length;
    const contents = byteArray.subarray(position, byteLength);

    const raw = byteArray.subarray(0, byteLength); // May not be the whole input array

    return {
        cls,
        tag,
        structured,
        byteLength,
        contents,
        raw,
    };
};

const derToAsn1List = (byteArray: Uint8Array) => {
    const result = [];
    let nextPosition = 0;
    while (nextPosition < byteArray.length) {
        const nextPiece = derToAsn1(byteArray.subarray(nextPosition));
        result.push(nextPiece);
        nextPosition += nextPiece.byteLength;
    }

    return result;
};

const derBitStringValue = (byteArray: Uint8Array) => ({
    unusedBits: byteArray[0],
    bytes: byteArray.subarray(1),
});

// Optiga may produce a malformed signature with probability 1 in 256.
// https://github.com/trezor/trezor-firmware/issues/3411
export const fixSignature = (byteArray: Uint8Array) => {
    const asn1 = derToAsn1(byteArray);

    if (asn1.cls !== 0 || asn1.tag !== 16 || !asn1.structured) {
        throw new Error('Bad signature. Not a SEQUENCE.');
    }

    const items = derToAsn1List(asn1.contents);
    let newLength = 0;
    const fixedItems = items.map(chunk => {
        // find first significant byte
        const index = chunk.contents.findIndex(value => value > 0x00);
        const data = chunk.contents.subarray(index);
        // According to the DER-encoding rules, the integers are supposed to be prefixed with a 0x00 byte
        // if **and only if** the most significant byte is >= 0x80
        const offset = data[0] >= 0x80 ? 1 : 0;
        // create replacement for chunk
        const chunkLength = data.length + offset;
        const newChunk = new Uint8Array(chunkLength + 2);
        // set first two bytes: original value and new length of the chunk
        newChunk.set([chunk.raw[0], chunkLength]);
        // optionally add 0
        if (offset > 0) {
            newChunk.set([0], 2);
        }
        // fill new chunk with data
        newChunk.set(data, 2 + offset);
        newLength += newChunk.length;

        return newChunk;
    });

    // create replacement for sequence object
    const signature = new Uint8Array(newLength + 2);
    // set two first bytes: original value and new length of all chunks
    signature.set([byteArray[0], newLength]);
    // fill new sequence with fixed items
    let signatureOffset = 2;
    fixedItems.forEach(item => {
        signature.set(item, signatureOffset);
        signatureOffset += item.length;
    });

    return signature;
};

const parseSignatureValue = (asn1: Asn1) => {
    if (asn1.cls !== 0 || asn1.tag !== 3 || asn1.structured) {
        throw new Error('Bad signature value. Not a BIT STRING.');
    }
    const { unusedBits, bytes } = derBitStringValue(asn1.contents);

    return {
        asn1,
        bits: { unusedBits, bytes: fixSignature(bytes) },
    };
};

const derObjectIdentifierValue = (byteArray: Uint8Array) => {
    let oid = `${Math.floor(byteArray[0] / 40)}.${byteArray[0] % 40}`;
    let position = 1;
    while (position < byteArray.length) {
        let nextInteger = 0;
        while (byteArray[position] >= 0x80) {
            nextInteger = nextInteger * 0x80 + (byteArray[position] & 0x7f);
            position += 1;
        }
        nextInteger = nextInteger * 0x80 + byteArray[position];
        position += 1;
        oid += `.${nextInteger}`;
    }

    return oid as Oid;
};

/*
 * AlgorithmIdentifier ::= SEQUENCE {
 *   algorithm     OBJECT IDENTIFIER,
 *   parameters    ANY DEFINED BY algorithm OPTIONAL
 * }
 */
const parseAlgorithmIdentifier = (asn1: Asn1) => {
    if (asn1.cls !== 0 || asn1.tag !== 16 || !asn1.structured) {
        throw new Error('Bad algorithm identifier. Not a SEQUENCE.');
    }
    const pieces = derToAsn1List(asn1.contents);
    if (pieces.length > 2) {
        throw new Error('Bad algorithm identifier. Contains too many child objects.');
    }
    const encodedAlgorithm = pieces[0];
    if (encodedAlgorithm.cls !== 0 || encodedAlgorithm.tag !== 6 || encodedAlgorithm.structured) {
        throw new Error('Bad algorithm identifier. Does not begin with an OBJECT IDENTIFIER.');
    }
    const algorithm = derObjectIdentifierValue(encodedAlgorithm.contents);

    return {
        asn1,
        algorithm,
        parameters: pieces.length === 2 ? { asn1: pieces[1] } : null,
    };
};

/*
 * Name ::= SEQUENCE {
 *   algorithm     OBJECT IDENTIFIER,
 *   parameters    ANY DEFINED BY algorithm OPTIONAL
 * }
 */
export const parseName = (asn1: Asn1) =>
    // SEQUENCE > SET > SEQUENCE
    derToAsn1List(asn1.contents).map(item => {
        const attrSet = derToAsn1(item.contents);

        return parseAlgorithmIdentifier(attrSet);
    });

/*
 * SubjectPublicKeyInfo ::= SEQUENCE {
 *   algorithm            AlgorithmIdentifier,
 *   subjectPublicKey     BIT STRING
 * }
 */
const parseSubjectPublicKeyInfo = (asn1: Asn1) => {
    if (asn1.cls !== 0 || asn1.tag !== 16 || !asn1.structured) {
        throw new Error('Bad SPKI. Not a SEQUENCE.');
    }
    const pieces = derToAsn1List(asn1.contents);
    if (pieces.length !== 2) {
        throw new Error('Bad SubjectPublicKeyInfo. Wrong number of child objects.');
    }

    return {
        asn1,
        algorithm: parseAlgorithmIdentifier(pieces[0]),
        bits: derBitStringValue(pieces[1].contents),
    };
};

/*
 * Time ::= CHOICE {
 *   utcTime        UTCTime,
 *   generalTime    GeneralizedTime
 * }
 * NOTE: UTC and generalized times may both appear. (generalized > 2050)
 */
const parseUtcTime = (time: Asn1) => {
    // tag: 23 = UTCTime (YYMMDDhhmmZ);
    // tag: 24 = GeneralizedTime (YYYYMMDDhhmmZ)
    let offset = 4;
    let yearOffset = 0;
    if (time.tag === 23) {
        offset = 2;
        yearOffset = 2000;
    }
    const utc = Buffer.from(time.contents).toString();
    const year = yearOffset + Number(utc.substring(0, offset));
    const month = Number(utc.substring(offset, offset + 2)) - 1;
    const day = Number(utc.substring(offset + 2, offset + 4));
    const hour = Number(utc.substring(offset + 4, offset + 6));
    const minute = Number(utc.substring(offset + 6, offset + 8));

    const date = new Date();
    date.setUTCFullYear(year, month, day);
    date.setUTCHours(hour, minute, 0);

    return date;
};

/*
 * Validity ::= SEQUENCE {
 *   from    Time,
 *   to      Time
 * }
 */
const parseValidity = (asn1: Asn1) => {
    const [from, to] = derToAsn1List(asn1.contents);

    return {
        from: parseUtcTime(from),
        to: parseUtcTime(to),
    };
};

/*
 * https://www.alvestrand.no/objectid/2.5.29.html
 * Extensions ::= SEQUENCE {
 *   extnID      OBJECT IDENTIFIER,
 *   critical    BOOLEAN OPTIONAL,
 *   extnValue   OCTET STRING
 * }
 */
const parseExtensions = (data: Asn1) => {
    const asn1 = derToAsn1(data.contents);
    if (asn1.cls !== 0 || asn1.tag !== 16 || !asn1.structured) {
        throw new Error("This can't be a Extension. Wrong data type.");
    }

    const readBoolean = (value?: Asn1) => {
        if (!value) return false;
        if (value.cls !== 0 || value.tag !== 1 || value.contents.length !== 1 || value.structured) {
            throw new Error("This can't be a boolean. Wrong data type.");
        }
        if (![0x00, 0xff].includes(value.contents[0])) {
            throw new Error('Invalid boolean value.');
        }

        return value.contents[0] === 0xff;
    };

    const readBitString = (uint8Array: Uint8Array) => {
        const buffer = Buffer.from(uint8Array);
        const tag = buffer.readUInt8(0);
        if (tag !== 3) {
            throw new Error("This can't be a bit string. Wrong data type.");
        }
        const length = buffer.readUInt8(1);
        const unusedBits = buffer.readUInt8(2);
        const bitStringBytes = buffer.subarray(3, 3 + length - 1); // -1 because the length includes the unusedBits byte
        const bitString = bitStringBytes.reduce(
            (str, byte) => str + byte.toString(2).padStart(8, '0'),
            '',
        );

        return bitString.slice(0, bitString.length - unusedBits) as '01';
    };

    const readInteger = (value?: Asn1) => {
        if (!value) return undefined;
        if (value.cls !== 0 || value.tag !== 2 || value.contents.length !== 1 || value.structured) {
            throw new Error("This can't be a integer. Wrong data type.");
        }

        return Buffer.from(value.contents).readInt8();
    };

    const extensions: Extension[] = [];
    derToAsn1List(asn1.contents).forEach(item => {
        const [id, ...pieces] = derToAsn1List(item.contents);
        if (id.cls !== 0 || id.tag !== 6 || id.structured) {
            throw new Error('Bad extension. Does not begin with an OBJECT IDENTIFIER.');
        }

        const algorithm = derObjectIdentifierValue(id.contents);
        const critical = pieces.length > 1 ? readBoolean(pieces[0]) : false;
        const extnValue = pieces.length > 1 ? pieces[1] : pieces[0];
        if (extnValue.cls !== 0 || extnValue.tag !== 4 || extnValue.structured) {
            throw new Error("This can't be a octet string. Wrong data type.");
        }

        if (algorithm === '2.5.29.15') {
            // https://www.alvestrand.no/objectid/2.5.29.15.html
            extensions.push({
                key: 'keyUsage',
                critical,
                keyCertSign: readBitString(extnValue.contents)[5] as '0' | '1',
            });
        } else if (algorithm === '2.5.29.19') {
            // https://www.alvestrand.no/objectid/2.5.29.19.html
            const fields = derToAsn1List(derToAsn1(extnValue.contents).contents);
            const ca = fields.length > 0 && fields[0].tag === 1 ? fields[0] : undefined;
            const len = fields.length > 0 && fields[0].tag === 2 ? fields[0] : fields[1];

            extensions.push({
                key: 'basicConstraints',
                critical,
                cA: readBoolean(ca),
                pathLenConstraint: readInteger(len),
            });
        } else {
            extensions.push({
                key: algorithm,
                critical,
                ...item,
            });
        }
    });

    return extensions;
};

/*
 * TBSCertificate ::= SEQUENCE {
 *   version         [0]  EXPLICIT Version DEFAULT v1,
 *   serialNumber         CertificateSerialNumber,
 *   signature            AlgorithmIdentifier,
 *   issuer               Name[],
 *   validity             Validity,
 *   subject              Name[],
 *   subjectPublicKeyInfo SubjectPublicKeyInfo,
 *   issuerUniqueID  [1]  IMPLICIT UniqueIdentifier OPTIONAL,
 *   subjectUniqueID [2]  IMPLICIT UniqueIdentifier OPTIONAL,
 *   extensions      [3]  EXPLICIT Extensions OPTIONAL
 * }
 */
const parseTBSCertificate = (asn1: Asn1) => {
    if (asn1.cls !== 0 || asn1.tag !== 16 || !asn1.structured) {
        throw new Error("This can't be a TBSCertificate. Wrong data type.");
    }
    const pieces = derToAsn1List(asn1.contents);
    if (pieces.length < 7) {
        throw new Error('Bad TBS Certificate. There are fewer than the seven required children.');
    }

    return {
        asn1,
        version: pieces[0],
        serialNumber: pieces[1],
        signature: parseAlgorithmIdentifier(pieces[2]),
        issuer: pieces[3],
        validity: parseValidity(pieces[4]),
        subject: parseName(pieces[5]),
        subjectPublicKeyInfo: parseSubjectPublicKeyInfo(pieces[6]),
        extensions: parseExtensions(pieces[7]),
    };
};

/*
 * Certificate ::= SEQUENCE {
 *   tbsCertificate       TBSCertificate,
 *   signatureAlgorithm   AlgorithmIdentifier,
 *   signatureValue       BIT STRING
 * }
 */
export const parseCertificate = (byteArray: Uint8Array) => {
    const asn1 = derToAsn1(byteArray);
    if (asn1.cls !== 0 || asn1.tag !== 16 || !asn1.structured) {
        throw new Error("This can't be an X.509 certificate. Wrong data type.");
    }
    const pieces = derToAsn1List(asn1.contents);
    if (pieces.length !== 3) {
        throw new Error('Certificate contains more than the three specified children.');
    }

    return {
        asn1,
        tbsCertificate: parseTBSCertificate(pieces[0]),
        signatureAlgorithm: parseAlgorithmIdentifier(pieces[1]),
        signatureValue: parseSignatureValue(pieces[2]),
    };
};
