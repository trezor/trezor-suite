import type {
    GetDependencyImpactInput,
    GraphExport,
    ImpactResult,
    LearningEventNode,
    RecallRelatedInput,
    RelatedResult,
    UpdateLearningInput,
} from '@ai/shared-types';
import neo4j, { type Driver } from 'neo4j-driver';

export class GraphService {
    private driver: Driver;

    constructor(uri: string, user: string, password: string) {
        this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    }

    /** Verify connectivity to Neo4j. */
    async healthCheck(): Promise<boolean> {
        try {
            await this.driver.verifyConnectivity();

            return true;
        } catch {
            return false;
        }
    }

    /** Ensure indexes and constraints exist. */
    async migrate(): Promise<void> {
        const session = this.driver.session();
        try {
            await session.run(
                'CREATE CONSTRAINT pkg_name IF NOT EXISTS FOR (p:Package) REQUIRE p.name IS UNIQUE',
            );
            await session.run(
                'CREATE CONSTRAINT symbol_key IF NOT EXISTS FOR (s:Symbol) REQUIRE (s.name, s.filePath) IS UNIQUE',
            );
            await session.run(
                'CREATE CONSTRAINT engineer_id IF NOT EXISTS FOR (e:Engineer) REQUIRE e.id IS UNIQUE',
            );
            await session.run(
                'CREATE INDEX learning_ts IF NOT EXISTS FOR (l:LearningEvent) ON (l.createdAt)',
            );
        } finally {
            await session.close();
        }
    }

    /**
     * Traverse the graph starting from a symbol or package and return all
     * nodes affected within the requested depth.
     */
    async getDependencyImpact(input: GetDependencyImpactInput): Promise<ImpactResult> {
        const session = this.driver.session({ defaultAccessMode: neo4j.session.READ });
        try {
            // Neo4j does not allow parameters in variable-length path patterns,
            // so we interpolate the depth as a validated integer literal.
            const depth = Number(input.depth);
            const result = await session.run(
                `
                MATCH path = (start)-[:DEPENDS_ON|AFFECTS*1..${depth}]->(affected)
                WHERE start.name = $symbol
                  AND (start:Package OR start:Symbol)
                RETURN
                  [n IN nodes(path) | n.name]   AS nodeNames,
                  [r IN relationships(path) | type(r)] AS relTypes,
                  labels(affected) AS affectedLabels,
                  affected.name AS affectedName
                `,
                { symbol: input.symbol },
            );

            const affectedPackages = new Set<string>();
            const affectedSymbols = new Set<string>();
            const graph: ImpactResult['graph'] = [];

            for (const record of result.records) {
                const names: string[] = record.get('nodeNames');
                const rels: string[] = record.get('relTypes');
                const labels: string[] = record.get('affectedLabels');
                const name: string = record.get('affectedName');

                if (labels.includes('Package')) affectedPackages.add(name);
                if (labels.includes('Symbol')) affectedSymbols.add(name);

                for (let i = 0; i < rels.length; i++) {
                    graph.push({
                        from: names[i],
                        to: names[i + 1],
                        relationship: rels[i],
                    });
                }
            }

            return {
                symbol: input.symbol,
                depth: input.depth,
                affectedPackages: [...affectedPackages],
                affectedSymbols: [...affectedSymbols],
                graph,
            };
        } finally {
            await session.close();
        }
    }

    /** Store a learning event node and optional relationships. */
    async storeLearning(
        event: LearningEventNode,
        relatedSymbols: string[],
    ): Promise<{ id: string }> {
        const session = this.driver.session({ defaultAccessMode: neo4j.session.WRITE });
        try {
            const id = event.id ?? crypto.randomUUID();
            const now = new Date().toISOString();

            await session.executeWrite(async tx => {
                await tx.run(
                    `
                    CREATE (l:LearningEvent {
                        id: $id,
                        summary: $summary,
                        detail: $detail,
                        tags: $tags,
                        engineerId: $engineerId,
                        createdAt: $createdAt
                    })
                    `,
                    {
                        id,
                        summary: event.summary,
                        detail: event.detail ?? '',
                        tags: event.tags,
                        engineerId: event.engineerId ?? '',
                        createdAt: now,
                    },
                );

                // Link to related symbols if they exist in the graph
                for (const sym of relatedSymbols) {
                    await tx.run(
                        `
                        MATCH (s:Symbol {name: $sym})
                        MATCH (l:LearningEvent {id: $id})
                        MERGE (l)-[:AFFECTS]->(s)
                        `,
                        { sym, id },
                    );
                }

                // Link to engineer if provided
                if (event.engineerId) {
                    await tx.run(
                        `
                        MERGE (e:Engineer {id: $engineerId})
                        WITH e
                        MATCH (l:LearningEvent {id: $id})
                        MERGE (l)-[:FIXED_BY]->(e)
                        `,
                        { engineerId: event.engineerId, id },
                    );
                }
            });

            return { id };
        } finally {
            await session.close();
        }
    }

    /** Delete a learning event node and all its relationships. */
    async deleteLearning(id: string): Promise<boolean> {
        const session = this.driver.session({ defaultAccessMode: neo4j.session.WRITE });
        try {
            const result = await session.run(
                'MATCH (l:LearningEvent {id: $id}) DETACH DELETE l RETURN count(l) AS deleted',
                { id },
            );

            return (result.records[0]?.get('deleted')?.toNumber?.() ?? 0) > 0;
        } finally {
            await session.close();
        }
    }

    /** Update properties on a learning event node. */
    async updateLearning(id: string, input: UpdateLearningInput): Promise<void> {
        const sets: string[] = [];
        const params: Record<string, unknown> = { id };

        if (input.summary !== undefined) {
            sets.push('l.summary = $summary');
            params.summary = input.summary;
        }
        if (input.detail !== undefined) {
            sets.push('l.detail = $detail');
            params.detail = input.detail;
        }
        if (input.tags !== undefined) {
            sets.push('l.tags = $tags');
            params.tags = input.tags;
        }

        if (sets.length === 0) return;

        const session = this.driver.session({ defaultAccessMode: neo4j.session.WRITE });
        try {
            await session.run(
                `MATCH (l:LearningEvent {id: $id}) SET ${sets.join(', ')}`,
                params,
            );
        } finally {
            await session.close();
        }
    }

    /** Return all nodes and edges in the knowledge graph, capped at limit. */
    async getFullGraph(limit: number): Promise<GraphExport> {
        const session = this.driver.session({ defaultAccessMode: neo4j.session.READ });
        try {
            const nodesResult = await session.run(
                `MATCH (n)
                 WHERE n:Package OR n:Symbol OR n:LearningEvent OR n:Engineer
                 RETURN labels(n) AS labels, properties(n) AS props
                 LIMIT $limit`,
                { limit: neo4j.int(limit) },
            );

            const edgesResult = await session.run(
                `MATCH (a)-[r]->(b)
                 WHERE (a:Package OR a:Symbol OR a:LearningEvent OR a:Engineer)
                   AND (b:Package OR b:Symbol OR b:LearningEvent OR b:Engineer)
                 RETURN coalesce(a.id, a.name) AS fromKey,
                        coalesce(b.id, b.name) AS toKey,
                        type(r) AS relType
                 LIMIT $limit`,
                { limit: neo4j.int(limit * 3) },
            );

            const nodes = nodesResult.records.map(r => {
                const labels: string[] = r.get('labels');
                const props = r.get('props') as Record<string, unknown>;
                const type = labels.find(l =>
                    ['Package', 'Symbol', 'LearningEvent', 'Engineer'].includes(l),
                ) ?? 'Unknown';
                const nodeId = (props.id as string) ?? (props.name as string) ?? '';
                const label = type === 'LearningEvent'
                    ? (props.summary as string)?.substring(0, 50) ?? nodeId
                    : nodeId;

                return { id: nodeId, label, type, properties: props };
            });

            const edges = edgesResult.records.map(r => ({
                from: r.get('fromKey') as string,
                to: r.get('toKey') as string,
                relationship: r.get('relType') as string,
            }));

            return { nodes, edges };
        } finally {
            await session.close();
        }
    }

    /** Graceful shutdown. */
    async close(): Promise<void> {
        await this.driver.close();
    }

    /**
     * Traverse graph from a learning or symbol and return related nodes.
     * At least one of learningId or symbol must be provided.
     */
    async recallRelated(input: RecallRelatedInput): Promise<RelatedResult> {
        const session = this.driver.session({ defaultAccessMode: neo4j.session.READ });
        try {
            const depth = Number(input.depth);

            let matchClause: string;
            const params: Record<string, unknown> = {};

            if (input.learningId) {
                matchClause = 'MATCH (start:LearningEvent {id: $startId})';
                params.startId = input.learningId;
            } else if (input.symbol) {
                matchClause = 'MATCH (start:Symbol {name: $symbol})';
                params.symbol = input.symbol;
            } else {
                return { learnings: [], symbols: [], engineers: [] };
            }

            const result = await session.run(
                `
                ${matchClause}
                MATCH path = (start)-[*1..${depth}]-(related)
                WHERE related <> start
                RETURN DISTINCT
                    labels(related) AS labels,
                    properties(related) AS props,
                    type(last(relationships(path))) AS relType
                `,
                params,
            );

            const learnings: RelatedResult['learnings'] = [];
            const symbols: RelatedResult['symbols'] = [];
            const engineers: RelatedResult['engineers'] = [];

            const seenIds = new Set<string>();

            for (const record of result.records) {
                const labels: string[] = record.get('labels');
                const props = record.get('props') as Record<string, unknown>;
                const relType: string = record.get('relType');

                const nodeKey = (props.id as string) ?? (props.name as string);
                if (seenIds.has(nodeKey)) continue;
                seenIds.add(nodeKey);

                if (labels.includes('LearningEvent')) {
                    learnings.push({
                        id: props.id as string,
                        summary: props.summary as string,
                        tags: (props.tags as string[]) ?? [],
                        relationship: relType,
                    });
                } else if (labels.includes('Symbol')) {
                    symbols.push({
                        name: props.name as string,
                        kind: (props.kind as string) ?? 'unknown',
                        filePath: (props.filePath as string) ?? '',
                        relationship: relType,
                    });
                } else if (labels.includes('Engineer')) {
                    engineers.push({
                        id: props.id as string,
                        relationship: relType,
                    });
                }
            }

            return { learnings, symbols, engineers };
        } finally {
            await session.close();
        }
    }

    /**
     * Bulk-ingest monorepo packages and their dependency edges.
     * Upserts Package nodes and DEPENDS_ON relationships.
     */
    async ingestPackages(
        packages: Array<{ name: string; version: string; path: string; deps: string[] }>,
    ): Promise<{ nodesCreated: number; edgesCreated: number }> {
        const session = this.driver.session({ defaultAccessMode: neo4j.session.WRITE });
        try {
            let nodesCreated = 0;
            let edgesCreated = 0;

            await session.executeWrite(async tx => {
                // Upsert all package nodes
                for (const pkg of packages) {
                    await tx.run(
                        `MERGE (p:Package {name: $name})
                         SET p.version = $version, p.path = $path`,
                        { name: pkg.name, version: pkg.version, path: pkg.path },
                    );
                    nodesCreated++;
                }

                // Create dependency edges
                for (const pkg of packages) {
                    for (const dep of pkg.deps) {
                        const result = await tx.run(
                            `MATCH (a:Package {name: $from})
                             MATCH (b:Package {name: $to})
                             MERGE (a)-[r:DEPENDS_ON]->(b)
                             RETURN r`,
                            { from: pkg.name, to: dep },
                        );
                        edgesCreated += result.records.length;
                    }
                }
            });

            return { nodesCreated, edgesCreated };
        } finally {
            await session.close();
        }
    }
}
