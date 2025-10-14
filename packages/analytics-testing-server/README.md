# Analytics Testing Server

A simple server for testing Trezor Suite analytics events. This server captures all incoming HTTP requests and displays them in a real-time web interface, making it easy for QA teams to monitor analytics events during mobile app testing.

## Features

- 🔍 **Real-time Event Capture**: Captures all analytics events sent to the server
- 📊 **Interactive Web Interface**: Clean, modern UI with search, filtering, and sorting
- 📚 **Type Definitions**: Built-in reference for SuiteNativeAnalyticsEvent and SuiteAnalyticsEvent types
- 🚀 **Easy Deployment**: Simple setup with minimal dependencies
- 📡 **Live Updates**: Server-Sent Events for real-time event streaming

## Quick Start

### Prerequisites

- Node.js 18+
- Yarn (recommended) or npm

### Installation

1. Install dependencies:

```bash
yarn install
```

2. Build the project:

```bash
yarn build
```

3. Start the server:

```bash
yarn start
```

4. Open your browser to `http://localhost:3001`

## Development

For development with hot reload:

```bash
yarn dev
```

This will start:

- Server on `http://localhost:3001`
- Client dev server on `http://localhost:3000` (with hot reload)

## Usage for QA Testing

### 1. Start the Server

```bash
yarn workspace @trezor/analytics-testing-server start
```

The server will be available at `http://localhost:3001`

### 2. Configure Suite-Native Analytics

To redirect analytics from suite-native to this testing server, you need to modify the analytics URL configuration.

**For suite-native**, you can modify the analytics URL in DEV utils.

The default analytics URL is `https://data.trezor.io/suite/log/stable.log`. Change it to:

```
http://[your local IP address]:3001/log
```

### 3. Monitor Events

1. Open `http://localhost:3001` in your browser
2. Use the suite-native app normally
3. Watch events appear in real-time in the web interface
4. Use the search and filter functionality to find specific events
5. Click "Details" to see all query parameters for each event
6. Reference the type definitions to verify event payloads

### 4. Event Details

Each analytics event includes:

- **Timestamp**: When the event was received
- **Event Type**: The type of analytics event (from `c_type` parameter)
- **URL**: The full request URL
- **Query Parameters**: All parameters sent with the request

Common query parameters:

- `c_type`: Event type
- `c_v`: Version
- `c_commit`: Git commit hash
- `c_instance_id`: Unique instance identifier
- `c_session_id`: Session identifier
- `c_timestamp`: Event timestamp
- `c_message_id`: Unique message identifier
- Plus event-specific payload fields

## API Endpoints

- `GET /*` - Captures analytics events (any path)
- `GET /api/events` - Returns all captured events
- `POST /api/events/clear` - Clears all captured events
- `GET /events` - Server-Sent Events stream for real-time updates

## Configuration

### Server Configuration

The server can be configured by modifying `src/server/index.ts`:

- Change the port
- Modify event storage limits
- Adjust CORS settings
- Customize response format

## Troubleshooting

### Server Not Starting

1. Check if port 3001 is available
2. Ensure all dependencies are installed
3. Check the console for error messages

### No Events Appearing

1. Verify the analytics URL is correctly configured in suite-native
2. Check the browser's developer console for network errors
3. Ensure the server is running and accessible
4. Verify CORS settings if testing from a different domain
