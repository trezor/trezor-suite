// Detox publishes no types for its internals. The runner reuses its path builder so it finds the
// per-test artifact directories under exactly the names Detox gave them.
declare module 'detox/src/artifacts/utils/ArtifactPathBuilder' {
    type DetoxTestSummary = {
        fullName: string;
        status: string;
        invocations: number;
    };

    class ArtifactPathBuilder {
        constructor(options: { rootDir: string });
        buildPathForTestArtifact(
            artifactName: string,
            testSummary?: DetoxTestSummary | null,
        ): string;
    }

    export = ArtifactPathBuilder;
}
