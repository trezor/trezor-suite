import { WordInput, WordInputAdvanced } from 'src/components/suite';
import { useRecovery } from 'src/hooks/suite';

export const SelectRecoveryWord = () => {
    const { wordRequestInputType } = useRecovery();

    if (wordRequestInputType === 6 || wordRequestInputType === 9) {
        return <WordInputAdvanced count={wordRequestInputType} />;
    }

    if (wordRequestInputType === 'plain') {
        return <WordInput />;
    }

    return null;
};
