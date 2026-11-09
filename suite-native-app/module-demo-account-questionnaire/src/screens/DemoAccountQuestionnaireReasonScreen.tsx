import { DemoAccountQuestionnaireStackRoutes } from '@suite-native/navigation';

import {
    type DemoAccountQuestionnaireAnswerOption,
    DemoAccountQuestionnaireScreenContent,
} from '../components/DemoAccountQuestionnaireScreenContent';

const REASON_ANSWER_OPTIONS = [
    {
        key: 'considering',
        translationId: 'moduleDemoAccountQuestionnaire.reason.options.considering',
    },
    {
        key: 'ad',
        translationId: 'moduleDemoAccountQuestionnaire.reason.options.ad',
    },
    {
        key: 'friend',
        translationId: 'moduleDemoAccountQuestionnaire.reason.options.friend',
    },
] satisfies DemoAccountQuestionnaireAnswerOption[];

export const DemoAccountQuestionnaireReasonScreen = () => (
    <DemoAccountQuestionnaireScreenContent
        questionId="reason"
        screenTitleTranslationId="moduleDemoAccountQuestionnaire.reason.title"
        answerOptions={REASON_ANSWER_OPTIONS}
        nextRoute={DemoAccountQuestionnaireStackRoutes.SuiteAction}
    />
);
