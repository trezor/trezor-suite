import styled from 'styled-components/native';
import colors from '../../../config/colors';

const ButtonPin = styled.TouchableHighlight`
    width: 80px;
    height: 80px;
    border: 1px solid ${colors.DIVIDER};
    background: ${colors.WHITE};
    position: relative;
`;

export default ButtonPin;
