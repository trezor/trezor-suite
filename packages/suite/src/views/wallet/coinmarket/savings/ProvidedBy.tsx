import styled from 'styled-components';
import { variables } from '@trezor/components';
import { Translation } from 'src/components/suite';

const Text = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
`;

interface ProvidedByProps {
    providerName?: string;
}

export const ProvidedBy = ({ providerName }: ProvidedByProps) => (
    <Text>
        <Translation id="TR_SAVINGS_PROVIDED_BY" values={{ providerName }} />
    </Text>
);
