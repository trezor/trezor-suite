import { InfoSegments } from '@trezor/components';

import { FormattedDate, type FormattedDateProps } from './FormattedDate';

export const FormattedDateWithBullet = ({ ...props }: FormattedDateProps) => (
    <InfoSegments gap={0}>
        <FormattedDate date {...props} />
        <FormattedDate time {...props} />
    </InfoSegments>
);
