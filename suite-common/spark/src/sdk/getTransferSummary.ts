import { type SparkTransfer } from '../feature/sparkFeatureReducer';

type GetTransferSummaryParams = {
    direction: SparkTransfer['direction'];
    rail: SparkTransfer['rail'];
};

export const getTransferSummary = ({ direction, rail }: GetTransferSummaryParams) => {
    if (rail === 'bitcoin') {
        return direction === 'send' ? 'Bitcoin withdrawal' : 'Bitcoin deposit';
    }

    if (rail === 'lightning') {
        return direction === 'send' ? 'Lightning payment' : 'Lightning receipt';
    }

    return direction === 'send' ? 'Spark transfer sent' : 'Spark transfer received';
};
