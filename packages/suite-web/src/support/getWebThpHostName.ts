import { getBrowserName } from '@suite-common/suite-utils';
import { capitalizeFirstLetter } from '@trezor/utils';

export const getWebThpHostName = () => capitalizeFirstLetter(getBrowserName());
