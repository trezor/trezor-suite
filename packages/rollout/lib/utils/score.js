"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var getScore = function () { return Math.random().toFixed(2); };
exports.getScore = getScore;
var isInProbability = function (rollout, score) {
    var IS_IN_PROBABILITY = true;
    var IS_NOT_IN_PROBABILITY = false;
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
exports.isInProbability = isInProbability;
