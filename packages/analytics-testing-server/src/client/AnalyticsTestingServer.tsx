import { useEffect, useState } from 'react';

import { EventTable } from './components/EventTable';

import './AnalyticsTestingServer.css';

interface AnalyticsEvent {
    id: string;
    timestamp: string;
    eventType: string;
    queryParams: Record<string, string>;
    url: string;
}

export const AnalyticsTestingServer = () => {
    const [events, setEvents] = useState<AnalyticsEvent[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    // Set up Server-Sent Events connection
    useEffect(() => {
        const eventSource = new EventSource('/events');

        eventSource.onopen = () => {
            setIsConnected(true);
        };

        eventSource.onmessage = event => {
            try {
                const data = JSON.parse(event.data);

                switch (data.type) {
                    case 'initial':
                        setEvents(data.events || []);
                        break;
                    case 'newEvent':
                        setEvents(prev => [data.event, ...prev]);
                        break;
                    case 'eventsCleared':
                        setEvents([]);
                        break;
                }
            } catch (error) {
                console.error('Error parsing SSE data:', error);
            }
        };

        eventSource.onerror = () => {
            setIsConnected(false);
            console.error('SSE connection error');
        };

        return () => {
            eventSource.close();
        };
    }, []);

    const clearEvents = async () => {
        try {
            await fetch('/api/events/clear', { method: 'POST' });
        } catch (error) {
            console.error('Failed to clear events:', error);
        }
    };

    return (
        <div className="app">
            <header className="app-header">
                <h1>🔍 Trezor Analytics Testing Server</h1>
                <div className="status-bar">
                    <div
                        className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}
                    >
                        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                    </div>
                    <span className="event-count">{events.length} events</span>
                    <button onClick={clearEvents} className="clear-button">
                        Clear All
                    </button>
                </div>
            </header>

            <main className="app-main">
                <EventTable events={events} />
            </main>

            <footer className="app-footer">
                <p>
                    📊 Analytics endpoint: <code>http://[your IP address]:3001/log</code>
                </p>
                <p>💡 Configure your app to send analytics to this server for testing</p>
            </footer>
        </div>
    );
};
