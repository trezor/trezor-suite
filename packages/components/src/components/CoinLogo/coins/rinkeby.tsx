import React from 'react';
import styled from 'styled-components';

const Svg = styled.svg``;
const Polygon = styled.polygon``;

interface SvgProps {
    width: number;
    height: number;
}

const SvgComponent = (props: SvgProps) => (
    <Svg viewBox="0 0 158 256" {...props}>
        <Polygon
            fill="#FF8C3A"
            points="78.5564547 0 76.8405794 5.83213429 76.8405794 175.067165 78.5564547 176.779971 157.113462 130.345132"
        />
        <Polygon
            fill="#FFB077"
            points="78.5570072 0 0 130.345132 78.5570072 176.780585 78.5570072 94.638964"
        />
        <Polygon
            fill="#FF8C3A"
            points="78.5564547 191.654124 77.5895482 192.832829 77.5895482 253.118066 78.5564547 255.942661 157.160119 145.242613"
        />
        <Polygon fill="#FA9495" points="78.5570072 255.941801 78.5570072 191.653264 0 145.241753" />
        <Polygon
            fill="#FF6B01"
            points="78.5564547 176.779787 157.112234 130.345562 78.5564547 94.6393938"
        />
        <Polygon
            fill="#FF8228"
            points="0.000552517986 130.345623 78.5563319 176.779848 78.5563319 94.6394552"
        />
    </Svg>
);

export default SvgComponent;
