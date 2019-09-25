import { Output } from '@wallet-types/sendForm';

/**
 * Get single output from outputs
 */

export const getOutput = (outputs: Output[], id: number) =>
    outputs.find(outputItem => outputItem.id === id) as Output;
