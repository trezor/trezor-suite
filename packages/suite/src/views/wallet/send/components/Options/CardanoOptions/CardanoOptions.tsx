import styled from 'styled-components';
import { Button, variables } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import { useSendFormContext } from 'src/hooks/wallet';

const Wrapper = styled.div`
    display: flex;
    justify-content: flex-end;

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        flex-direction: column-reverse;
        gap: ${spacingsPx.sm};
    }
`;

const AddRecipientButton = styled(Button)`
    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        width: 100%;
    }
`;

export const CardanoOptions = () => {
    const { addOutput } = useSendFormContext();

    return (
        <Wrapper>
            <AddRecipientButton
                variant="tertiary"
                size="small"
                icon="PLUS"
                data-test-id="add-output"
                onClick={addOutput}
            >
                <Translation id="RECIPIENT_ADD" />
            </AddRecipientButton>
        </Wrapper>
    );
};
