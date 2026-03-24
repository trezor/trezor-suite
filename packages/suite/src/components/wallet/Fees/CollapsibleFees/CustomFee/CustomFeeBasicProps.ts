import { type TranslationFunction } from '@suite/intl';

export type CustomFeeBasicProps = {
    composedFeePerByte: string | undefined;
    translationString: TranslationFunction;
    feeUnits: string;
    sharedRules: {
        required: string;
        validate: (value: string) => string | undefined;
    };
};
