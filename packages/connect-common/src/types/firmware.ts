/**
 * 'production': current production firmware
 * 'production-early-access': upcoming production firmware
 * 'test-unsigned': unsigned test firmware for QA
 * 'test-unsigned-stable': unsigned test firmware for stable QA
 * 'test-signed': signed test firmware for QA
 * 'localhost-unsigned': unsigned localhost firmware for development
 * 'localhost-signed': signed localhost firmware for development
 */
export type FirmwareChannel =
    | 'production'
    | 'production-early-access'
    | 'test-unsigned'
    | 'test-unsigned-stable'
    | 'test-signed'
    | 'localhost-unsigned'
    | 'localhost-signed';
