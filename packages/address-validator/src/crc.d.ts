declare module 'crc' {
    export function crc16xmodem(payload: ArrayLike<number> | Buffer): number;
    export function crc16(payload: ArrayLike<number> | Buffer): number;
    export function crc32(payload: ArrayLike<number> | Buffer): number;
    export function crcjam(payload: ArrayLike<number> | Buffer): number;
    export function ccitt(payload: ArrayLike<number> | Buffer): number;
    export function modbus(payload: ArrayLike<number> | Buffer): number;
    export function xmodem(payload: ArrayLike<number> | Buffer): number;
}
