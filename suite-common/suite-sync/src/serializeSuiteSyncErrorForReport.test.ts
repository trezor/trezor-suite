import { createSuiteSyncUpdateError } from '@suite-common/suite-sync-storage';

import { serializeSuiteSyncErrorForReport } from './serializeSuiteSyncErrorForReport';

const LABEL = 'Savings for the house';
const XPUB =
    'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz';
const ADDRESS = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
const TXID = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b';

describe(serializeSuiteSyncErrorForReport.name, () => {
    it('drops the rejected row from an Evolu validation error', () => {
        const evoluObjectError = {
            type: 'Object',
            value: { id: 'row-id', accountDescriptor: XPUB, networkSymbol: 'btc', label: LABEL },
            reason: {
                kind: 'Props',
                errors: {
                    label: { type: 'MaxLength', value: LABEL, max: 1000 },
                },
            },
        };

        const serialized = serializeSuiteSyncErrorForReport(
            createSuiteSyncUpdateError({ caused: evoluObjectError }),
        );

        expect(serialized).not.toContain(LABEL);
        expect(serialized).not.toContain(XPUB);
        expect(serialized).toContain('"type":"SuiteSyncUpdateError"');
        expect(serialized).toContain('"type":"Object"');
        expect(serialized).toContain('"kind":"Props"');
        expect(serialized).toContain('"type":"MaxLength"');
        expect(serialized).toContain('"max":1000');
    });

    it('keeps only discriminators of a nested cause', () => {
        const serialized = serializeSuiteSyncErrorForReport({
            type: 'QuotaManagerCommunicationFailed',
            caused: { type: 'HttpError', code: 503, message: `Service Unavailable ${ADDRESS}` },
        });

        expect(serialized).toBe(
            '{"type":"QuotaManagerCommunicationFailed","caused":{"type":"HttpError","code":503,"message":"[redacted]"}}',
        );
    });

    it('reduces Error instances to their name', () => {
        const serialized = serializeSuiteSyncErrorForReport(
            createSuiteSyncUpdateError(new Error(`SQLITE_CONSTRAINT: ${TXID}`)),
        );

        expect(serialized).toBe('{"type":"SuiteSyncUpdateError","caused":{"name":"Error"}}');
    });

    it('redacts identifiers, binary payloads and array items', () => {
        const serialized = serializeSuiteSyncErrorForReport({
            type: 'RelayQuotaExceeded',
            ownerId: 'yg0UgROParTpm60ltI3hDw',
            data: new Uint8Array([222, 173, 190, 239]),
            addresses: [ADDRESS],
        });

        expect(serialized).toBe(
            '{"type":"RelayQuotaExceeded","ownerId":"[redacted]","data":"[redacted]","addresses":["[redacted]"]}',
        );
    });
});
