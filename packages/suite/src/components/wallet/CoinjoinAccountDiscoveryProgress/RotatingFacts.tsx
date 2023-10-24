import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { motionEasing, variables } from '@trezor/components';
import { Translation, TranslationKey } from 'src/components/suite/Translation';

const Fact = styled(motion.p)`
    max-width: 460px;
    height: 42px;
    margin-top: 6px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    line-height: 1.5;
    text-align: center;
`;

// better type safety than just storing a count
const FACTS: Array<TranslationKey> = [
    'TR_LOADING_FACT_0',
    'TR_LOADING_FACT_1',
    'TR_LOADING_FACT_2',
    'TR_LOADING_FACT_3',
    'TR_LOADING_FACT_4',
    'TR_LOADING_FACT_5',
    'TR_LOADING_FACT_6',
    'TR_LOADING_FACT_7',
    'TR_LOADING_FACT_8',
    'TR_LOADING_FACT_9',
    'TR_LOADING_FACT_11',
    'TR_LOADING_FACT_12',
    'TR_LOADING_FACT_13',
    'TR_LOADING_FACT_14',
    'TR_LOADING_FACT_15',
    'TR_LOADING_FACT_16',
    'TR_LOADING_FACT_17',
    'TR_LOADING_FACT_18',
    'TR_LOADING_FACT_19',
    'TR_LOADING_FACT_20',
    'TR_LOADING_FACT_21',
    'TR_LOADING_FACT_22',
    'TR_LOADING_FACT_23',
    'TR_LOADING_FACT_24',
    'TR_LOADING_FACT_25',
    'TR_LOADING_FACT_26',
];

const factsCount = FACTS.length;

const selectNextHint = (currentIndex: number) => (currentIndex + 1) % factsCount;

export const RotatingFacts = () => {
    const firstHintIndex = Math.floor(Math.random() * (factsCount - 1));
    const [factIndex, setFactIndex] = useState(firstHintIndex);

    useEffect(() => {
        const interval = setInterval(() => setFactIndex(selectNextHint), 10000);

        return () => clearInterval(interval);
    }, []);

    return (
        <AnimatePresence mode="wait">
            <Fact
                key={factIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: motionEasing.transition }}
            >
                <Translation id={FACTS[factIndex]} />
            </Fact>
        </AnimatePresence>
    );
};
