import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { colors } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
`;

const Option = styled.div`
    text-transform: uppercase;
`;

const On = styled(Option)`
    color: ${colors.NEUE_BG_GREEN};
`;

const Off = styled(Option)`
    color: ${colors.NEUE_TYPE_RED};
`;

const EqualSign = styled.div`
    padding: 0 4px;
`;

interface Props {
    isOn: boolean;
    hasEqualSign?: boolean;
}

const OnOffSwitcher = ({ isOn = true, hasEqualSign = true }: Props) => {
    return (
        <Wrapper>
            {hasEqualSign && <EqualSign> = </EqualSign>}
            {isOn ? (
                <On>
                    <Translation id="TR_ON" />
                </On>
            ) : (
                <Off>
                    <Translation id="TR_OFF" />
                </Off>
            )}
        </Wrapper>
    );
};

export default OnOffSwitcher;
