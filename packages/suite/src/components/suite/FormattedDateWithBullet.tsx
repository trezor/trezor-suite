import { InfoSegments } from '@trezor/components';

import { FormattedDate, type FormattedDateProps } from './FormattedDate';

export const FormattedDateWithBullet = ({ ...props }: FormattedDateProps) => (
    <InfoSegments>
        <FormattedDate date {...props} />
        <FormattedDate time {...props} />
    </InfoSegments>
);
