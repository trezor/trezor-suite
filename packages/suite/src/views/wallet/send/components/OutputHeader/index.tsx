import React from 'react';
import { colors, variables } from '@trezor/components';
import styled from 'styled-components';
import { Output } from '@wallet-types/sendForm';
import Remove from './components/Remove';

import { Props as DProps } from '../../Container';

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
    sendFormActionsBitcoin: DProps['sendFormActionsBitcoin'];
    output: Output;
    outputs: Output[];
}

export default ({ outputs, output, sendFormActionsBitcoin }: Props) => (
    <Wrapper>
        <Column />
        <Column>{outputs.length > 1 && <OutputIndex>#{output.id + 1}</OutputIndex>}</Column>
        <ColumnRight>
            {output.id !== 0 && (
                <>
                    <Remove sendFormActionsBitcoin={sendFormActionsBitcoin} outputId={output.id} />
                </>
            )}
        </ColumnRight>
    </Wrapper>
);
