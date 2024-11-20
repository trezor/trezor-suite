import { InfoPair } from '@trezor/components';

import { FormattedDate, FormattedDateProps } from './FormattedDate';

export const FormattedDateWithBullet = ({ ...props }: FormattedDateProps) => (
    <InfoPair
        leftContent={<FormattedDate date {...props} />}
        rightContent={<FormattedDate time {...props} />}
    />
);
