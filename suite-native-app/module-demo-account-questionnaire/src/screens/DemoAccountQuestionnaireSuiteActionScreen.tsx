import { DemoAccountQuestionnaireStackRoutes } from '@suite-native/navigation';

import {
    type DemoAccountQuestionnaireAnswerOption,
    DemoAccountQuestionnaireScreenContent,
} from '../components/DemoAccountQuestionnaireScreenContent';

const SUITE_ACTION_ANSWER_OPTIONS = [
    {
        key: 'explore',
        translationId: 'moduleDemoAccountQuestionnaire.suiteAction.options.explore',
        iconName: 'starFour',
    },
    {
        key: 'transaction',
        translationId: 'moduleDemoAccountQuestionnaire.suiteAction.options.transaction',
        iconName: 'sliders',
    },
    {
        key: 'hardwareWallet',
        translationId: 'moduleDemoAccountQuestionnaire.suiteAction.options.hardwareWallet',
        iconName: 'trezorSafe7',
    },
] satisfies DemoAccountQuestionnaireAnswerOption[];

export const DemoAccountQuestionnaireSuiteActionScreen = () => (
    <DemoAccountQuestionnaireScreenContent
        questionId="suiteAction"
        screenTitleTranslationId="moduleDemoAccountQuestionnaire.suiteAction.title"
        answerOptions={SUITE_ACTION_ANSWER_OPTIONS}
        nextRoute={DemoAccountQuestionnaireStackRoutes.Success}
    />
);
