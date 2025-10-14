import React, { useMemo, useState } from 'react';
import './EventTable.css';

interface AnalyticsEvent {
    id: string;
    timestamp: string;
    eventType: string;
    queryParams: Record<string, string>;
    url: string;
}

interface EventTableProps {
    events: AnalyticsEvent[];
}

export function EventTable({ events }: EventTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'timestamp' | 'eventType'>('timestamp');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [showDetails, setShowDetails] = useState(false);

    const SESSION_PARAM_KEYS = useMemo(
        () => [
            'c_v',
            'c_commit',
            'c_instance_id',
            'c_session_id',
            'c_message_id',
            'c_type',
            'c_timestamp',
        ],
        [],
    );

    const filteredAndSortedEvents = useMemo(() => {
        const filtered = events.filter(
            event =>
                event.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.timestamp.includes(searchTerm) ||
                Object.values(event.queryParams).some(value =>
                    value.toLowerCase().includes(searchTerm.toLowerCase()),
                ),
        );

        filtered.sort((a, b) => {
            let comparison = 0;

            if (sortBy === 'timestamp') {
                comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            } else if (sortBy === 'eventType') {
                comparison = a.eventType.localeCompare(b.eventType);
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }, [events, searchTerm, sortBy, sortOrder]);

    const handleSort = (column: 'timestamp' | 'eventType') => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const base = date.toLocaleString();
        const ms = date.getMilliseconds().toString().padStart(3, '0');
        return `${base}.${ms}`;
    };

    const getEventTypeColor = (eventType: string) => {
        if (eventType.includes('error') || eventType.includes('fail')) return '#ff6b6b';
        if (eventType.includes('success') || eventType.includes('complete')) return '#51cf66';
        if (eventType.includes('start') || eventType.includes('init')) return '#339af0';

        return '#868e96';
    };

    return (
        <div className="event-table-container">
            <div className="table-controls">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="sort-controls">
                    <label>
                        Sort by:
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as 'timestamp' | 'eventType')}
                        >
                            <option value="timestamp">Timestamp</option>
                            <option value="eventType">Event Type</option>
                        </select>
                    </label>

                    <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="sort-order-button"
                    >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                </div>

                <div className="sort-controls">
                    <label>
                        <input
                            type="checkbox"
                            checked={showDetails}
                            onChange={e => setShowDetails(e.target.checked)}
                        />{' '}
                        Show details
                    </label>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="event-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('timestamp')} className="sortable">
                                Timestamp{' '}
                                {sortBy === 'timestamp' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('eventType')} className="sortable">
                                Event Type{' '}
                                {sortBy === 'eventType' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>Params</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedEvents.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="no-events">
                                    {events.length === 0
                                        ? 'No events captured yet. Send analytics to this server to see them here.'
                                        : 'No events match your search criteria.'}
                                </td>
                            </tr>
                        ) : (
                            filteredAndSortedEvents.map(event => (
                                <React.Fragment key={event.id}>
                                    <tr className="event-row">
                                        <td className="timestamp-cell">
                                            {formatTimestamp(event.timestamp)}
                                        </td>
                                        <td className="event-type-cell">
                                            <span
                                                className="event-type-badge"
                                                style={{
                                                    backgroundColor: getEventTypeColor(
                                                        event.eventType,
                                                    ),
                                                }}
                                            >
                                                {event.eventType}
                                            </span>
                                        </td>
                                        <td className="params-inline-cell">
                                            <div
                                                className="inline-params"
                                                title={Object.entries(event.queryParams)
                                                    .filter(
                                                        ([key]) =>
                                                            !SESSION_PARAM_KEYS.includes(key),
                                                    )
                                                    .map(([key, value]) => `${key}: ${value}`)
                                                    .join(' | ')}
                                            >
                                                {Object.entries(event.queryParams)
                                                    .filter(
                                                        ([key]) =>
                                                            !SESSION_PARAM_KEYS.includes(key),
                                                    )
                                                    .map(([key, value]) => (
                                                        <div key={key} className="param-item">
                                                            <span className="param-key">
                                                                {key}:
                                                            </span>
                                                            <span className="param-value">
                                                                {value}
                                                            </span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </td>
                                    </tr>
                                    {showDetails && (
                                        <tr className="details-row">
                                            <td colSpan={3}>
                                                <div className="event-details">
                                                    <h4>URL</h4>
                                                    <div className="url-full">
                                                        <code>
                                                            {event.url.split('&').join('&\n')}
                                                        </code>
                                                    </div>
                                                    <h4>Params</h4>
                                                    <div className="params-grid">
                                                        {Object.entries(event.queryParams).map(
                                                            ([key, value]) => (
                                                                <div
                                                                    key={key}
                                                                    className="param-item"
                                                                >
                                                                    <span className="param-key">
                                                                        {key}:
                                                                    </span>
                                                                    <span className="param-value">
                                                                        {value}
                                                                    </span>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
