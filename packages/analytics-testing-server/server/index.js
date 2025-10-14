const cors = require('cors');
const { EventEmitter } = require('events');
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// In-memory storage for events
const events = [];
const eventEmitter = new EventEmitter();

// API endpoint to get all events
app.get('/api/events', (req, res) => {
    res.json({
        events,
        total: events.length,
    });
});

// API endpoint to clear all events
app.post('/api/events/clear', (req, res) => {
    events.length = 0;
    eventEmitter.emit('eventsCleared');
    res.json({ success: true, message: 'Events cleared' });
});

// Server-Sent Events endpoint for real-time updates
app.get('/events', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Send initial data
    res.write(`data: ${JSON.stringify({ type: 'initial', events })}\n\n`);

    // Listen for new events
    const onNewEvent = event => {
        res.write(`data: ${JSON.stringify({ type: 'newEvent', event })}\n\n`);
    };

    const onEventsCleared = () => {
        res.write(`data: ${JSON.stringify({ type: 'eventsCleared' })}\n\n`);
    };

    eventEmitter.on('newEvent', onNewEvent);
    eventEmitter.on('eventsCleared', onEventsCleared);

    // Clean up on disconnect
    req.on('close', () => {
        eventEmitter.off('newEvent', onNewEvent);
        eventEmitter.off('eventsCleared', onEventsCleared);
    });
});

// Analytics endpoint - captures analytics events (specific route)
app.get('/log', (req, res) => {
    const event = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        eventType: req.query.c_type || 'unknown',
        queryParams: req.query,
        url: req.url,
    };

    // Add to events array (newest first)
    events.unshift(event);

    // Keep only last 1000 events to prevent memory issues
    if (events.length > 1000) {
        events.splice(1000);
    }

    // Emit event for real-time updates
    eventEmitter.emit('newEvent', event);

    // Log the event
    console.log(`📊 Analytics Event: ${event.eventType} at ${event.timestamp}`);

    // Return simple response
    res.status(200).json({
        success: true,
        message: 'Event captured',
        eventId: event.id,
    });
});

// Serve static files from the built client
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all route for SPA (must be last)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Analytics Testing Server running on port ${PORT}`);
    console.log(`📊 Web interface: http://localhost:${PORT}`);
    console.log(`🔗 Analytics endpoint: http://localhost:${PORT}/log`);
    console.log(`📡 Real-time events: http://localhost:${PORT}/events`);
});
