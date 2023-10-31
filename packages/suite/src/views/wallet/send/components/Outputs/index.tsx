import { useRef, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { useSendFormContext } from 'src/hooks/wallet';
import { variables, motionAnimation } from '@trezor/components';
import { Address } from './components/Address';
import { Amount } from './components/Amount';
import OpReturn from './components/OpReturn';

const Wrapper = styled.div``;

const OutputWrapper = styled.div<{ index: number }>`
    display: flex;
    flex-direction: column;
    margin: 32px 42px;
    margin-bottom: 20px;

    &:last-child {
        margin-bottom: 0;
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin: 32px 20px;
    }

    ${props =>
        props.index > 0 &&
        css`
            margin: 0 42px;
            padding-top: 32px;
            border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
        `}
`;

const Row = styled.div`
    padding: 0 0 10px;

    &:last-child {
        padding: 0;
    }
`;

interface OutputsProps {
    disableAnim?: boolean; // used in tests, with animations enabled react-testing-library can't find output fields
}

const Outputs = ({ disableAnim }: OutputsProps) => {
    const { outputs } = useSendFormContext();
    const [renderedOutputs, setRenderedOutputs] = useState(1);
    const lastOutputRef = useRef<HTMLDivElement | null>(null);

    const onAddAnimationComplete = () => {
        // scrolls only on adding outputs, doesn't scroll on removing them
        if (outputs.length > 1 && outputs.length > renderedOutputs) {
            lastOutputRef?.current?.scrollIntoView({ behavior: 'smooth' });
        }

        setRenderedOutputs(outputs.length);
    };

    useEffect(() => {
        if (outputs.length < renderedOutputs) {
            // updates rendered outputs count when removing an output
            // this is necessary because onAddAnimationComplete is not fired when removing 2nd output
            setRenderedOutputs(outputs.length);
        }
    }, [outputs.length, renderedOutputs, setRenderedOutputs]);

    const animation = outputs.length > 1 && !disableAnim ? motionAnimation.expand : {}; // do not animate if there is only 1 output, prevents animation on clear

    return (
        <AnimatePresence initial={false}>
            <Wrapper>
                {outputs.map((output, index) => (
                    <motion.div
                        key={output.id}
                        {...animation}
                        onAnimationComplete={onAddAnimationComplete}
                    >
                        <OutputWrapper
                            ref={index === outputs.length - 1 ? lastOutputRef : undefined} // set ref to last output
                            index={index}
                        >
                            {output.type === 'opreturn' ? (
                                <OpReturn outputId={index} />
                            ) : (
                                <>
                                    <Row>
                                        <Address
                                            output={outputs[index]}
                                            outputId={index}
                                            outputsCount={outputs.length}
                                        />
                                    </Row>
                                    <Row>
                                        <Amount output={outputs[index]} outputId={index} />
                                    </Row>
                                </>
                            )}
                        </OutputWrapper>
                    </motion.div>
                ))}
            </Wrapper>
        </AnimatePresence>
    );
};

export default Outputs;
