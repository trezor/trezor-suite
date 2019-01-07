const getScore = () => Math.random().toFixed(2);

const isInProbability = (rollout, score) => {
    const IS_IN_PROBABILITY = true;
    const IS_NOT_IN_PROBABILITY = false;

    if (score == null || Number.isNaN(score)) {
        throw new Error('score not supplied. If you want to override this functionality, just pass 0');
    }

    if (!rollout) {
        return IS_IN_PROBABILITY;
    }

    if (rollout >= score) {
        return IS_IN_PROBABILITY;
    }

    return IS_NOT_IN_PROBABILITY;
};

export {
    getScore,
    isInProbability,
};
