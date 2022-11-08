import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { motionEasing, variables } from '@trezor/components';
import { TranslationKey } from '@suite-components/Translation/components/BaseTranslation';
import { Translation } from '@suite-components/Translation';
import { AnimatePresence, motion } from 'framer-motion';

const Fact = styled(motion.p)`
    max-width: 420px;
    height: 42px;
    margin-top: 6px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    line-height: 1.5;
    text-align: center;
`;

const CJ_FACTS: Array<TranslationKey> = [
    'TR_COINJOIN_FACT_ONE',
    'TR_COINJOIN_FACT_TWO',
    'TR_COINJOIN_FACT_THREE',
    'TR_COINJOIN_FACT_FOUR',
    'TR_COINJOIN_FACT_FIVE',
    'TR_COINJOIN_FACT_SIX',
    'TR_COINJOIN_FACT_SEVEN',
    'TR_COINJOIN_FACT_EIGHT',
    'TR_COINJOIN_FACT_NINE',
    'TR_COINJOIN_FACT_TEN',
];

const factsCount = CJ_FACTS.length;

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
                <Translation id={CJ_FACTS[factIndex]} />
            </Fact>
        </AnimatePresence>
    );
};
