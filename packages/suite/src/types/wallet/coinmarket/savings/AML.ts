import { SavingsTradeAMLQuestion, SavingsTradeAMLAnswer } from '@suite-services/invityAPI';
import { WithSelectedAccountLoadedProps } from '@wallet-components';

export type UseSavingsAMLProps = WithSelectedAccountLoadedProps;

export type SavingsAMLContextValues = {
    amlQuestions?: SavingsTradeAMLQuestion[];
    handleSubmit: (answers: SavingsTradeAMLAnswer[]) => Promise<void>;
};
