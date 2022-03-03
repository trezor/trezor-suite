import type { SavingsTradeAMLQuestion, SavingsTradeAMLAnswer } from '@suite-services/invityAPI';
import type { WithSelectedAccountLoadedProps } from '@wallet-components';

export interface QuestionAnswer {
    [key: string]: string;
}

export type UseSavingsAMLProps = WithSelectedAccountLoadedProps;

export type SavingsAMLContextValues = {
    handleSubmit: (answers: SavingsTradeAMLAnswer[]) => Promise<void>;
    canSubmitAnswers: boolean;
    isSubmitting: boolean;

    amlQuestions?: SavingsTradeAMLQuestion[];
    answers: SavingsTradeAMLAnswer[];
    selectedQuestionAnswers: QuestionAnswer;

    handleAmlAnswerOptionClick: (key: string, answer: string) => void;
    isWatchingKYCStatus: boolean;
};
