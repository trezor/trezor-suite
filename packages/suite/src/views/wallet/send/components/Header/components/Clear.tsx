import { Translation } from 'src/components/suite/Translation';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { useSendFormContext } from 'src/hooks/wallet';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
`;

const In = styled.div`
    cursor: pointer;
    display: flex;
    align-items: center;
    padding-right: 10px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

export const Clear = () => {
    const {
        resetContext,
        formState: { isDirty },
    } = useSendFormContext();

    if (!isDirty) return null;
    return (
        <Wrapper>
            <In>
                <Button variant="tertiary" onClick={resetContext} data-test="clear-form">
                    <Translation id="TR_CLEAR_ALL" />
                </Button>
            </In>
        </Wrapper>
    );
};
