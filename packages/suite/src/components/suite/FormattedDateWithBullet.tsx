import { InfoSegments } from '@trezor/components';

import type { FormattedDateProps } from './FormattedDate';
import { FormattedDate } from './FormattedDate';

export const FormattedDateWithBullet = ({ ...props }: FormattedDateProps) => (
    <InfoSegments>
        <FormattedDate date {...props} />
        <FormattedDate time {...props} />
    </InfoSegments>
);
