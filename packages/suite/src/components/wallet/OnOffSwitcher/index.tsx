import styled from 'styled-components';
import { Translation } from 'src/components/suite';

const Wrapper = styled.div`
    display: flex;
`;

const Option = styled.div`
    text-transform: uppercase;
`;

const On = styled(Option)`
    color: ${({ theme }) => theme.BG_GREEN};
`;

const Off = styled(Option)`
    color: ${({ theme }) => theme.TYPE_RED};
`;

const EqualSign = styled.div`
    padding: 0 4px;
`;

interface OnOffSwitcherProps {
    isOn: boolean;
    hasEqualSign?: boolean;
}

const OnOffSwitcher = ({ isOn = true, hasEqualSign = true }: OnOffSwitcherProps) => (
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

export default OnOffSwitcher;
