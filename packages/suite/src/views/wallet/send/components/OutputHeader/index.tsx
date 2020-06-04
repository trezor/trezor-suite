import React from 'react';
import { colors, variables } from '@trezor/components';
import styled from 'styled-components';
import Remove from './components/Remove';

const Wrapper = styled.div`
    display: flex;
    min-height: 17px;
    justify-content: space-between;
`;

const OutputIndex = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK25};
`;

const Column = styled.div`
    display: flex;
    flex: 1;
`;

const ColumnRight = styled(Column)`
    justify-content: flex-end;
`;

interface Props {
    removeOutput: (id: number) => {};
    outputId: number;
    outputsCount: number;
}

export default ({ outputsCount, outputId, removeOutput }: Props) => (
    <Wrapper>
        <Column />
        <Column>{outputsCount > 1 && <OutputIndex>#{outputId + 1}</OutputIndex>}</Column>
        <ColumnRight>
            {outputId !== 0 && (
                <>
                    <Remove removeOutput={removeOutput} outputId={outputId} />
                </>
            )}
        </ColumnRight>
    </Wrapper>
);
