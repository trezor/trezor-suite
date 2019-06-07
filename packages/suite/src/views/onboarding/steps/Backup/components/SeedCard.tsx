import React from 'react';
import styled, { css } from 'styled-components';
import { Icon } from '@trezor/components';

import colors from '@suite/config/onboarding/colors';
import Pencil from './Pencil';

const WIDTH = 360;
const RATIO = 0.57;
const BORDER = `1px solid ${colors.gray}`;

const Card = styled.div`
    width: ${WIDTH}px;
    height: ${WIDTH * RATIO}px;
    font-size: 12px;

    perspective: 1000px;
`;

const CardInner = styled.div<{ showBack: boolean; flipOnMouseOver: boolean }>`
    position: relative;

    width: 100%;
    height: 100%;
    text-align: center;
    transition: transform 0.8s;
    transform-style: preserve-3d;

    transform: ${({ showBack }) => (showBack ? 'rotateY(180deg)' : 'rotateY(0)')};
    box-shadow: 0 4px 8px 0 ${colors.gray};
    border: ${BORDER};

    ${props =>
        props.flipOnMouseOver &&
        css`
            &:hover {
                transform: ${({ showBack }: { showBack: boolean }) =>
                    !showBack ? 'rotateY(180deg)' : 'rotateY(0)'};
            }
        `};
`;

const CardFront = styled.div`
    position: absolute;
    display: flex;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
`;

const CardBack = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    transform: rotateY(180deg);
`;

const Line = styled.div<{ wordsNumber: number }>`
    height: calc(88% / 6);
    width: ${props => (props.wordsNumber === 24 ? '23%' : '48%')};
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1px;
    margin-top: 1px;
    padding-left: 2px;
`;

const LineNumber = styled.div`
    font-size: 0.75em;
    max-width: 8px;
`;

const LineBox = styled.div<{ isChecking: boolean }>`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 85%;
    border: 1px dashed ${props => (props.isChecking ? colors.brandPrimary : colors.gray)};
`;

const LineWord = styled.div`
    transition: all 500ms linear;
`;

const FrontLeft = styled.div`
    height: 100%;
    width: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    border-right: ${BORDER};
`;

const FrontRight = styled.div`
    height: 100%;
    width: 50%;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
`;

const FrontHeader = styled.div`
    font-weight: lighter;
    font-size: 1em;
    line-height: 1.2em;
`;

const DeviceLabel = styled.div`
    width: 90%;
    height: 30px;
    border: 1px solid ${colors.black};
    display: flex;
    justify-content: center;
    align-items: center;
    color: ${colors.gray};
    font-size: 1em;
`;

const DoNotDisclose = styled.div`
    font-weight: bold;
    font-size: 0.5em;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const TrezorLogoVertical = () => (
    <svg
        style={{ height: '10%' }}
        id="Vrstva_1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 121.7 86.3"
    >
        <polygon points="0,63.6 0,68.8 6.2,68.8 6.2,85.9 12,85.9 12,68.8 18.1,68.8 18.1,63.6" />
        <path d="M38.9,71c0-4.4-3.1-7.4-7.7-7.4H20.7v22.3h5.8v-7.5h2.2l4.1,7.5h6.7l-4.9-8.3C36.8,76.8,38.9,74.7,38.9,71z M26.5,68.8 h4.1c1.5,0,2.5,0.9,2.5,2.3c0,1.3-1,2.3-2.5,2.3h-4.1V68.8z" />
        <polygon points="41.2,85.9 57.4,85.9 57.4,80.8 47,80.8 47,77.2 57.2,77.2 57.2,72 47,72 47,68.8 57.4,68.8 57.4,63.6 41.2,63.6" />
        <polygon points="77,68.1 77,63.6 59.9,63.6 59.9,68.8 69.2,68.8 59.9,81.5 59.9,85.9 77,85.9 77,80.7 67.7,80.7" />
        <path d="M89.2,63.3c-6.7,0-11.6,4.9-11.6,11.5c0,6.7,4.9,11.5,11.6,11.5c6.8,0,11.7-4.9,11.7-11.5C100.9,68.1,96,63.3,89.2,63.3z M89.2,81c-3.4,0-5.7-2.6-5.7-6.3c0-3.7,2.3-6.3,5.7-6.3c3.4,0,5.8,2.6,5.8,6.3C95,78.5,92.6,81,89.2,81z" />
        <path d="M116.8,77.7c2.1-0.8,4.3-2.9,4.3-6.6c0-4.4-3.1-7.4-7.7-7.4h-10.5v22.3h5.8v-7.5h2.2l4.1,7.5h6.7L116.8,77.7z M108.6,68.8 h4.1c1.5,0,2.5,0.9,2.5,2.3c0,1.3-1,2.3-2.5,2.3h-4.1V68.8z" />
        <path d="M70.3,14.2v-3.5c0-5.9-5-10.7-11.2-10.7c-6.2,0-11.2,4.8-11.2,10.7v3.5h-4.6v24.6h0l15.9,7.4l15.9-7.4h0V14.2H70.3z M53.6,10.7c0-2.7,2.5-5,5.5-5c3,0,5.5,2.2,5.5,5v3.5H53.6V10.7z M68.6,34.7l-9.5,4.4l-9.5-4.4V20h19V34.7z" />
    </svg>
);

const Back = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    flex-wrap: wrap;
`;

interface Props {
    showBack?: boolean;
    words?: string[];
    wordsNumber?: number;
    checkingWordNumber?: number | null;
    writingWordNumber?: number | null;
    flipOnMouseOver?: boolean;
}

const SeedCardModelT = ({
    showBack = false,
    words = [],
    wordsNumber = 24,
    checkingWordNumber = null,
    writingWordNumber = null,
    flipOnMouseOver = false,
}: Props) => (
    <Card>
        <CardInner showBack={showBack} flipOnMouseOver={flipOnMouseOver}>
            <CardFront>
                <FrontLeft>
                    <TrezorLogoVertical />
                </FrontLeft>
                <FrontRight>
                    <FrontHeader>
                        YOUR PERSONAL <br /> RECOVERY CARD
                    </FrontHeader>
                    <DeviceLabel>DEVICE LABEL</DeviceLabel>
                    <DoNotDisclose>
                        <Icon style={{ marginBottom: '8px' }} icon="EYE_CROSSED" size={18} />
                        DO NOT DISCLOSE THE SEED <br /> TO ANYBODY
                    </DoNotDisclose>
                </FrontRight>
            </CardFront>
            <CardBack>
                <Back>
                    {Array.from(Array(wordsNumber)).map((item, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <Line key={`${item}-${index}`} wordsNumber={wordsNumber}>
                            <LineNumber>{index + 1}</LineNumber>
                            <LineBox isChecking={index + 1 === checkingWordNumber}>
                                <LineWord>{words[index]}</LineWord>
                                {(index + 1 === writingWordNumber ||
                                    index + 1 === checkingWordNumber) && (
                                    <Pencil
                                        animate={index + 1 === writingWordNumber}
                                        style={{ marginBottom: '24px' }}
                                    />
                                )}
                            </LineBox>
                        </Line>
                    ))}
                </Back>
            </CardBack>
        </CardInner>
    </Card>
);

export { SeedCardModelT };
