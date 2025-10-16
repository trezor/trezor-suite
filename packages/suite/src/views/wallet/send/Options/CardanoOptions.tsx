import styled from 'styled-components';

import { NewButton, variables } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';
import { useSendFormContext } from 'src/hooks/wallet';

const Wrapper = styled.div`
    display: flex;
    justify-content: flex-end;

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        flex-direction: column-reverse;
        gap: ${spacingsPx.sm};
    }
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const AddRecipientButton = styled(NewButton)`
    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        width: 100%;
    }
`;

export const CardanoOptions = () => {
    const { addOutput } = useSendFormContext();

    return (
        <Wrapper>
            <AddRecipientButton
                intent="neutral"
                priority="secondary"
                size="small"
                iconLeft="plus"
                data-testid="add-output"
                onClick={addOutput}
            >
                <Translation id="RECIPIENT_ADD" />
            </AddRecipientButton>
        </Wrapper>
    );
};
