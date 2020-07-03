import React from 'react';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components';
import { useSendFormContext } from '@wallet-hooks';
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

export default ({ outputId }: { outputId: number }) => {
    const { outputs } = useSendFormContext();
    return (
        <Wrapper>
            <Column />
            <Column>
                {outputs.fields.length > 1 && <OutputIndex>#{outputId + 1}</OutputIndex>}
            </Column>
            <ColumnRight>{outputs.fields.length > 1 && <Remove outputId={outputId} />}</ColumnRight>
        </Wrapper>
    );
};
