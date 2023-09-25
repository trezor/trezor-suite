import { useRef } from 'react';
import styled from 'styled-components';
import { Textarea, Button } from '@trezor/components';

import { Translation } from 'src/components/suite';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    min-height: 250px;
    justify-content: space-between;
    gap: 20px;
`;

interface InputCSVProps {
    onSubmit: (value: string) => void;
}

export const InputCSV = ({ onSubmit }: InputCSVProps) => {
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

    return (
        <Wrapper>
            <Textarea noError rows={9} innerRef={textAreaRef} />
            <Button
                variant="primary"
                isFullWidth
                onClick={() => onSubmit(textAreaRef.current?.value || '')}
            >
                <Translation id="IMPORT_CSV" />
            </Button>
        </Wrapper>
    );
};
