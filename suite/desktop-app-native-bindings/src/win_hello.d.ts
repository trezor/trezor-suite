/**
 * Type definitions for Windows Hello native module
 */

/**
 * Checks if Windows Hello is available on the system
 * @returns true if Windows Hello is available, otherwise throws an error
 */
export function isHelloAvailable(): boolean;

/**
 * Requests Windows Hello authentication
 * @param message The message to display in the Windows Hello prompt
 * @returns "Success" if authentication was successful, otherwise throws an error
 */
export function requestHello(message: string): string;
