type Priority = 'high' | 'medium' | 'low';

export type TestRecommendation = {
    test: string;
    priority: Priority;
    reasoning: string;
    related_changes: string[];
};

export type SelectionResult = {
    changed_files: string[];
    uncovered_changes: string[];
    recommendations: TestRecommendation[];
    summary: string;
};
