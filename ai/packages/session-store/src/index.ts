import type {
    AuditEvent,
    LearningDetail,
    LearningResult,
    LearningSearchResult,
    RecallLearningsInput,
    SaveSessionInput,
    SessionDetail,
    SessionResult,
    UpdateLearningInput,
} from '@ai/shared-types';
import pg from 'pg';

const { Pool } = pg;

export class SessionStore {
    private pool: pg.Pool;

    constructor(config: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
    }) {
        this.pool = new Pool(config);
    }

    /** Verify Postgres connectivity. */
    async healthCheck(): Promise<boolean> {
        try {
            await this.pool.query('SELECT 1');

            return true;
        } catch {
            return false;
        }
    }

    /** Create tables if they don't exist. */
    async migrate(): Promise<void> {
        await this.pool.query(`
            CREATE TABLE IF NOT EXISTS learnings (
                id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                summary     TEXT NOT NULL,
                detail      TEXT,
                tags        TEXT[] DEFAULT '{}',
                engineer_id TEXT,
                created_at  TIMESTAMPTZ DEFAULT now()
            );

            CREATE TABLE IF NOT EXISTS audit_events (
                id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                action    TEXT NOT NULL,
                actor     TEXT,
                payload   JSONB DEFAULT '{}',
                timestamp TIMESTAMPTZ DEFAULT now()
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title        TEXT NOT NULL,
                summary      TEXT NOT NULL,
                next_steps   TEXT[] DEFAULT '{}',
                engineer_id  TEXT,
                tags         TEXT[] DEFAULT '{}',
                learning_ids UUID[] DEFAULT '{}',
                created_at   TIMESTAMPTZ DEFAULT now()
            );

            CREATE INDEX IF NOT EXISTS idx_learnings_created ON learnings (created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events (timestamp DESC);
            CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions (created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_learnings_tags ON learnings USING GIN (tags);
        `);

        // Add tsvector column + GIN index for full-text search (idempotent)
        await this.pool.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'learnings' AND column_name = 'fts'
                ) THEN
                    ALTER TABLE learnings
                        ADD COLUMN fts tsvector
                        GENERATED ALWAYS AS (
                            setweight(to_tsvector('english', coalesce(summary, '')), 'A') ||
                            setweight(to_tsvector('english', coalesce(detail, '')), 'B')
                        ) STORED;
                    CREATE INDEX idx_learnings_fts ON learnings USING GIN (fts);
                END IF;
            END $$;
        `);
    }

    /** Persist a session learning. */
    async storeLearning(input: {
        summary: string;
        detail?: string;
        tags?: string[];
        engineerId?: string;
    }): Promise<LearningResult> {
        const { rows } = await this.pool.query<{
            id: string;
            summary: string;
            created_at: Date;
        }>(
            `INSERT INTO learnings (summary, detail, tags, engineer_id)
             VALUES ($1, $2, $3, $4)
             RETURNING id, summary, created_at`,
            [input.summary, input.detail ?? null, input.tags ?? [], input.engineerId ?? null],
        );

        const row = rows[0];

        return {
            id: row.id,
            summary: row.summary,
            createdAt: row.created_at.toISOString(),
        };
    }

    /** Search learnings with FTS, tag, engineer, and date filters. */
    async searchLearnings(input: RecallLearningsInput): Promise<LearningSearchResult> {
        const conditions: string[] = [];
        const params: unknown[] = [];
        let paramIdx = 1;

        if (input.query) {
            conditions.push(`fts @@ websearch_to_tsquery('english', $${paramIdx})`);
            params.push(input.query);
            paramIdx++;
        }

        if (input.tags && input.tags.length > 0) {
            conditions.push(`tags @> $${paramIdx}`);
            params.push(input.tags);
            paramIdx++;
        }

        if (input.engineerId) {
            conditions.push(`engineer_id = $${paramIdx}`);
            params.push(input.engineerId);
            paramIdx++;
        }

        if (input.since) {
            conditions.push(`created_at >= $${paramIdx}`);
            params.push(input.since);
            paramIdx++;
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Rank by FTS relevance when a query is present, otherwise by recency
        const orderBy = input.query
            ? `ts_rank(fts, websearch_to_tsquery('english', $1)) DESC, created_at DESC`
            : 'created_at DESC';

        const countResult = await this.pool.query<{ count: string }>(
            `SELECT count(*)::text FROM learnings ${where}`,
            params,
        );

        params.push(input.limit);
        const limitIdx = paramIdx++;
        params.push(input.offset);
        const offsetIdx = paramIdx;

        const { rows } = await this.pool.query<{
            id: string;
            summary: string;
            detail: string | null;
            tags: string[];
            engineer_id: string | null;
            created_at: Date;
        }>(
            `SELECT id, summary, detail, tags, engineer_id, created_at
             FROM learnings ${where}
             ORDER BY ${orderBy}
             LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
            params,
        );

        return {
            items: rows.map(r => ({
                id: r.id,
                summary: r.summary,
                detail: r.detail,
                tags: r.tags,
                engineerId: r.engineer_id,
                createdAt: r.created_at.toISOString(),
            })),
            total: Number(countResult.rows[0].count),
            limit: input.limit,
            offset: input.offset,
        };
    }

    /** Get a single learning by ID. */
    async getLearning(id: string): Promise<LearningDetail | null> {
        const { rows } = await this.pool.query<{
            id: string;
            summary: string;
            detail: string | null;
            tags: string[];
            engineer_id: string | null;
            created_at: Date;
        }>(
            `SELECT id, summary, detail, tags, engineer_id, created_at
             FROM learnings WHERE id = $1`,
            [id],
        );

        if (rows.length === 0) return null;

        const r = rows[0];

        return {
            id: r.id,
            summary: r.summary,
            detail: r.detail,
            tags: r.tags,
            engineerId: r.engineer_id,
            createdAt: r.created_at.toISOString(),
        };
    }

    /** Delete a learning by ID. Returns true if a row was deleted. */
    async deleteLearning(id: string): Promise<boolean> {
        const { rowCount } = await this.pool.query(
            'DELETE FROM learnings WHERE id = $1',
            [id],
        );

        return (rowCount ?? 0) > 0;
    }

    /** Update a learning by ID. Returns the updated learning or null if not found. */
    async updateLearning(id: string, input: UpdateLearningInput): Promise<LearningDetail | null> {
        const sets: string[] = [];
        const params: unknown[] = [];
        let idx = 1;

        if (input.summary !== undefined) {
            sets.push(`summary = $${idx++}`);
            params.push(input.summary);
        }
        if (input.detail !== undefined) {
            sets.push(`detail = $${idx++}`);
            params.push(input.detail);
        }
        if (input.tags !== undefined) {
            sets.push(`tags = $${idx++}`);
            params.push(input.tags);
        }

        if (sets.length === 0) return this.getLearning(id);

        params.push(id);
        const { rows } = await this.pool.query<{
            id: string;
            summary: string;
            detail: string | null;
            tags: string[];
            engineer_id: string | null;
            created_at: Date;
        }>(
            `UPDATE learnings SET ${sets.join(', ')} WHERE id = $${idx}
             RETURNING id, summary, detail, tags, engineer_id, created_at`,
            params,
        );

        if (rows.length === 0) return null;

        const r = rows[0];

        return {
            id: r.id,
            summary: r.summary,
            detail: r.detail,
            tags: r.tags,
            engineerId: r.engineer_id,
            createdAt: r.created_at.toISOString(),
        };
    }

    /** Save a structured session summary. */
    async saveSession(input: SaveSessionInput): Promise<SessionResult> {
        const { rows } = await this.pool.query<{
            id: string;
            title: string;
            created_at: Date;
        }>(
            `INSERT INTO sessions (title, summary, next_steps, engineer_id, tags, learning_ids)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, title, created_at`,
            [
                input.title,
                input.summary,
                input.nextSteps,
                input.engineerId ?? null,
                input.tags,
                input.learningIds,
            ],
        );

        const row = rows[0];

        return {
            id: row.id,
            title: row.title,
            createdAt: row.created_at.toISOString(),
        };
    }

    /** Get the most recent sessions. */
    async getRecentSessions(limit = 10): Promise<SessionDetail[]> {
        const { rows } = await this.pool.query<{
            id: string;
            title: string;
            summary: string;
            next_steps: string[];
            engineer_id: string | null;
            tags: string[];
            learning_ids: string[];
            created_at: Date;
        }>(
            `SELECT id, title, summary, next_steps, engineer_id, tags, learning_ids, created_at
             FROM sessions ORDER BY created_at DESC LIMIT $1`,
            [limit],
        );

        return rows.map(r => ({
            id: r.id,
            title: r.title,
            summary: r.summary,
            nextSteps: r.next_steps,
            engineerId: r.engineer_id,
            tags: r.tags,
            learningIds: r.learning_ids,
            createdAt: r.created_at.toISOString(),
        }));
    }

    /**
     * Delete audit events older than the given number of days.
     * Returns the count of deleted rows.
     */
    async purgeAuditEvents(retentionDays = 90): Promise<number> {
        const { rowCount } = await this.pool.query(
            `DELETE FROM audit_events WHERE timestamp < now() - make_interval(days => $1)`,
            [retentionDays],
        );

        return rowCount ?? 0;
    }

    /** Record an audit event. */
    async audit(event: Omit<AuditEvent, 'id'>): Promise<void> {
        await this.pool.query(
            `INSERT INTO audit_events (action, actor, payload, timestamp)
             VALUES ($1, $2, $3, $4)`,
            [event.action, event.actor, JSON.stringify(event.payload), event.timestamp],
        );
    }

    /** Graceful shutdown. */
    async close(): Promise<void> {
        await this.pool.end();
    }
}
