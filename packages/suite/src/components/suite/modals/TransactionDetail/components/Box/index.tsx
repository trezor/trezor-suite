import styled from 'styled-components';

const COLOR_BORDER = '#E6E6E6';

const Box = styled.div`
    border-radius: 3px;
    border: solid 2px ${COLOR_BORDER};

    & + & {
        margin-top: 20px;
    }
`;

export default Box;
