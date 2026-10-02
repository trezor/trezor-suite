import { getWeakRandomId } from '@trezor/utils';

export const getRandomAccountDescriptor = () => getWeakRandomId(20);
