/**
 * The device shows the digits shuffled in a 3x3 grid and the host only sends positions. The
 * positions are numbered like a numeric keypad, with 7 8 9 in the top row.
 */
export const PIN_MATRIX_ROWS = [
    [7, 8, 9],
    [4, 5, 6],
    [1, 2, 3],
] as const;

export const MAX_PIN_LENGTH = 9;

export const canAppendPinPosition = (pin: string) => pin.length < MAX_PIN_LENGTH;

/** Adds one matrix position. The PIN is returned unchanged once it has the maximum length. */
export const appendPinPosition = (pin: string, position: number) =>
    canAppendPinPosition(pin) && Number.isInteger(position) && position >= 1 && position <= 9
        ? `${pin}${position}`
        : pin;

export const removeLastPinPosition = (pin: string) => pin.slice(0, -1);

export const isSubmittablePin = (pin: string) => /^[1-9]{1,9}$/.test(pin);
