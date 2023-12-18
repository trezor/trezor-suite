import { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { useSendFormContext } from 'src/hooks/wallet';
import { Card, motionAnimation } from '@trezor/components';
import { Address } from './components/Address';
import { Amount } from './components/Amount';
import OpReturn from './components/OpReturn';
import { spacingsPx } from '@trezor/theme';

const OutputWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.sm};
`;

interface OutputsProps {
    disableAnim?: boolean; // used in tests, with animations enabled react-testing-library can't find output fields
}

export const Outputs = ({ disableAnim }: OutputsProps) => {
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
        <Card paddingType="large">
            <AnimatePresence initial={false}>
                <div>
                    {outputs.map((output, index) => (
                        <motion.div
                            key={output.id}
                            {...animation}
                            onAnimationComplete={onAddAnimationComplete}
                        >
                            <OutputWrapper
                                ref={index === outputs.length - 1 ? lastOutputRef : undefined} // set ref to last output
                            >
                                {output.type === 'opreturn' ? (
                                    <OpReturn outputId={index} />
                                ) : (
                                    <>
                                        <Address
                                            output={outputs[index]}
                                            outputId={index}
                                            outputsCount={outputs.length}
                                        />

                                        <Amount output={outputs[index]} outputId={index} />
                                    </>
                                )}
                            </OutputWrapper>
                        </motion.div>
                    ))}
                </div>
            </AnimatePresence>
        </Card>
    );
};
