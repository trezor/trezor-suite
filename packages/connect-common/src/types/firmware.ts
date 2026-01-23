export type FirmwareUpdateSource =
    | 'production'
    | 'test-unsigned'
    | 'test-unsigned-stable'
    | 'test-signed'
    | 'localhost-unsigned'
    | 'localhost-signed';
