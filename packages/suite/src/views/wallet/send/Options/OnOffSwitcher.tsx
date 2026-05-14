import styled from 'styled-components';

import { Translation } from '@suite/intl';

const Wrapper = styled.div`
    display: flex;
`;

const Option = styled.div`
    text-transform: uppercase;
`;

const On = styled(Option)`
    color: ${({ theme }) => theme.legacyBackgroundPrimaryDefault};
`;

const Off = styled(Option)`
    color: ${({ theme }) => theme.contentCritical};
`;

const EqualSign = styled.div`
    padding: 0 4px;
`;

interface OnOffSwitcherProps {
    isOn: boolean;
    hasEqualSign?: boolean;
}

export const OnOffSwitcher = ({ isOn = true, hasEqualSign = true }: OnOffSwitcherProps) => (
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
