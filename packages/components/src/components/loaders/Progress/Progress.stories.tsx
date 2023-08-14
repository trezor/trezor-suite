import { Progress as ProgressComponent } from './Progress';

export default {
    title: 'Loaders/Progress',
    component: ProgressComponent,
};

export const Progress = {
    args: {
        max: 100,
        value: 21,
    },
};
