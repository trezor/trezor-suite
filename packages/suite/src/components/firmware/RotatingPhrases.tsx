import { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { TranslationKey } from '@suite-common/intl-types';
import { Card, H4, Paragraph, motionEasing } from '@trezor/components';

import { Translation } from 'src/components/suite';

const PHRASES_COUNT = 12;

type RotatingPhrasesProps = {
    interval?: number;
};

export const RotatingPhrases = ({ interval = 10000 }: RotatingPhrasesProps) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setIndex(prev => (prev + 1) % PHRASES_COUNT);
        }, interval);

        return () => clearInterval(id);
    }, [interval]);

    return (
        <Card fillType="flat" paddingType="large">
            <H4 typographyStyle="callout" variant="tertiary" align="center" margin={{ bottom: 12 }}>
                <Translation id="TR_DYK_TITLE" />
            </H4>
            <div role="status" aria-live="polite" aria-atomic>
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, ease: motionEasing.enter }}
                    >
                        <Paragraph align="center">
                            <Translation id={`TR_DYK_ITEM_${index + 1}` as TranslationKey} />
                        </Paragraph>
                    </motion.div>
                </AnimatePresence>
            </div>
        </Card>
    );
};
