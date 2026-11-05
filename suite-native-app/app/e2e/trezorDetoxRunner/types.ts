export interface ProjectConfig {
    projectName: string;
    target: string;
    model?: string;
    firmwareVersion?: string;
    grep?: string;
}

export interface RunnerConfig {
    projects: ProjectConfig[];
}
