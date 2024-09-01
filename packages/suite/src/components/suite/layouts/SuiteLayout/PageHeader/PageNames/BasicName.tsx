import styled from 'styled-components';
import { H2 } from '@trezor/components';
import { TranslationKey } from '@suite-common/intl-types';
import { Translation } from 'src/components/suite';

// eslint-disable-next-line local-rules/no-override-ds-component
export const HeaderHeading = styled(H2)`
    display: flex;
    align-items: center;
`;

export interface BasicNameProps {
    nameId: TranslationKey;
}

export const BasicName = ({ nameId }: BasicNameProps) => (
    <HeaderHeading>
        <Translation id={nameId} />
    </HeaderHeading>
);
