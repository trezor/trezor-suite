const getScore = () => Math.random().toFixed(2);

const isInProbability = (rollout, score) => {
    const IS_IN_PROBABILITY = true;
    const IS_NOT_IN_PROBABILITY = false;

    if (rollout >= score) {
        return IS_IN_PROBABILITY;
    }

    return IS_NOT_IN_PROBABILITY;
};

export {
    getScore,
    isInProbability,
};
