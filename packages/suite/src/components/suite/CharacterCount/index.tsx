import styled from 'styled-components';
import { variables } from '@trezor/components';

const Wrapper = styled.div`
    position: absolute;
    bottom: 35px;
    right: 15px;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const CharacterCount = ({
    current,
    max,
    className,
}: {
    current: number;
    max: number;
    className?: string;
}) => (
    <Wrapper className={className}>
        {current} / {max}
    </Wrapper>
);

export default CharacterCount;
