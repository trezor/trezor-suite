import React from 'react';
import Svg, { SvgProps, Path, Circle } from 'react-native-svg';

const SvgComponent = (props: SvgProps) => (
    <Svg viewBox="0 0 256 256" {...props}>
        <Circle cx="128" cy="128" r="128" fill="#3468d1" />
        <Path
            fill="#fff"
            d="M265.727,717.735a12.652,12.652,0,1,1-12.654,12.652A12.654,12.654,0,0,1,265.727,717.735Zm30.546,0a12.652,12.652,0,1,1-12.655,12.652A12.654,12.654,0,0,1,296.273,717.735Zm0,53.226a12.652,12.652,0,1,1-12.655,12.652A12.653,12.653,0,0,1,296.273,770.961Zm-30.546,0a12.652,12.652,0,1,1-12.654,12.652A12.653,12.653,0,0,1,265.727,770.961Zm-15.709-26.177a12.652,12.652,0,1,1-12.654,12.652A12.654,12.654,0,0,1,250.018,744.784Zm61.964,0a12.652,12.652,0,1,1-12.655,12.652A12.653,12.653,0,0,1,311.982,744.784Zm14.4-21.813a7.853,7.853,0,1,1-7.855,7.853A7.853,7.853,0,0,1,326.382,722.971Zm0,52.352a7.853,7.853,0,1,1-7.855,7.853A7.853,7.853,0,0,1,326.382,775.323Zm-90.764,0a7.853,7.853,0,1,1-7.854,7.853A7.854,7.854,0,0,1,235.618,775.323Zm0-52.352a7.853,7.853,0,1,1-7.854,7.853A7.854,7.854,0,0,1,235.618,722.971ZM281,696.794a7.853,7.853,0,1,1-7.855,7.853A7.853,7.853,0,0,1,281,696.794ZM281,801.5a7.853,7.853,0,1,1-7.855,7.853A7.853,7.853,0,0,1,281,801.5Zm33.6,7.853a6.544,6.544,0,1,1-6.546,6.544A6.544,6.544,0,0,1,314.6,809.353Zm-67.2,0a6.544,6.544,0,1,1-6.546,6.544A6.544,6.544,0,0,1,247.4,809.353Zm0-117.794a6.544,6.544,0,1,1-6.546,6.544A6.544,6.544,0,0,1,247.4,691.559Zm67.2,0a6.544,6.544,0,1,1-6.546,6.544A6.544,6.544,0,0,1,314.6,691.559Zm34.036,58.461a6.544,6.544,0,1,1-6.545,6.544A6.545,6.545,0,0,1,348.636,750.02Zm-135.273,0a6.544,6.544,0,1,1-6.545,6.544A6.544,6.544,0,0,1,213.363,750.02Zm-4.8-40.138a5.236,5.236,0,1,1-5.236,5.235A5.236,5.236,0,0,1,208.563,709.882Zm0,83.765a5.236,5.236,0,1,1-5.236,5.235A5.236,5.236,0,0,1,208.563,793.647Zm144.873,0a5.236,5.236,0,1,1-5.236,5.235A5.236,5.236,0,0,1,353.436,793.647Zm0-83.765a5.236,5.236,0,1,1-5.236,5.235A5.236,5.236,0,0,1,353.436,709.882ZM281,668a5.236,5.236,0,1,1-5.237,5.235A5.235,5.235,0,0,1,281,668Zm0,167.529a5.236,5.236,0,1,1-5.237,5.236A5.236,5.236,0,0,1,281,835.529Zm46.254-3.49a4.363,4.363,0,1,1-4.363,4.363A4.363,4.363,0,0,1,327.254,832.039Zm-92.509,0a4.363,4.363,0,1,1-4.363,4.363A4.363,4.363,0,0,1,234.745,832.039Zm0-158.8a4.363,4.363,0,1,1-4.363,4.363A4.363,4.363,0,0,1,234.745,673.235Zm92.509,0a4.363,4.363,0,1,1-4.363,4.363A4.363,4.363,0,0,1,327.254,673.235Zm45.382,79.4A4.363,4.363,0,1,1,368.273,757,4.363,4.363,0,0,1,372.636,752.637Zm-183.273,0A4.363,4.363,0,1,1,185,757,4.363,4.363,0,0,1,189.363,752.637Z"
            transform="translate(-152 -629)"
        />
    </Svg>
);

export default SvgComponent;
