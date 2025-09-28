# TRMNL Beszel System Metrics Plugin

![logo](./logo.png)

A TRMNL plugin that displays real-time system metrics from Beszel monitoring via PocketBase. This plugin shows CPU, memory, disk usage, load averages, uptime, and other system information on your TRMNL e-ink display.

## Features

- 📊 **Real-time System Metrics**: CPU, Memory, and Disk usage with visual gauges
- 📈 **Load Average Monitoring**: 1, 5, and 15-minute load averages
- ⏱️ **System Uptime**: Formatted uptime display
- 🌡️ **Temperature Monitoring**: Disk temperature readings
- 🔄 **Container Tracking**: Number of running containers
- 🌐 **Network Bandwidth**: Real-time network usage
- 📱 **Multi-View Support**: Full, half horizontal, half vertical, and quadrant views
- 🔄 **Auto-refresh**: Configurable refresh intervals (default: 60 seconds)

## Architecture

This project consists of two main components:

1. **Node.js API Server** (`server.js`): Connects to PocketBase to fetch Beszel monitoring data
2. **TRMNL Plugin** (`src/` directory): Liquid templates that render the data on your TRMNL device

## Prerequisites

- Node.js 18.0.0 or higher
- Beszel monitoring system with PocketBase backend
- TRMNL device and account
- Docker (optional, for running TRMNLP development server)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/trmnl-beszel-plugin.git
cd trmnl-beszel-plugin
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file or set environment variables:

```bash
# Required for API server
POCKETBASE_URL=http://your-pocketbase-url:port/
POCKETBASE_EMAIL=your-email@example.com
POCKETBASE_PASSWORD=your-password

# Optional - for updating remote TRMNL plugin
PRIVATE_PLUGIN_URL=https://usetrmnl.com/api/custom_plugins/46b80e80-b410-47bb-88da-e3e25600c07f

# Development
NODE_ENV=development
PORT=3000
```

## Usage

### Development Mode

1. **Start the API Server**:
   ```bash
   npm run dev
   ```

2. **Start TRMNL Plugin Development Server**:
   ```bash
   npm run trmnlp:serve
   ```
   This will start the TRMNLP development server at http://localhost:4567

3. **View Your Plugin**: Open http://localhost:4567 to see your plugin in different view modes

### Production Deployment

#### Option 1: Docker Compose (Recommended)

```bash
# Update docker-compose.yml with your environment variables
docker-compose up -d
```

#### Option 2: Direct Node.js

```bash
npm start
```

The API server will be available at `http://localhost:3000/metrics`

### TRMNL Plugin Deployment

1. **Login to TRMNL**:
   ```bash
   npm run trmnlp:login
   ```

2. **Push Plugin to TRMNL**:
   ```bash
   npm run trmnlp:push
   ```

3. **Configure Your Device**: 
   - Go to https://usetrmnl.com/playlists
   - Add your plugin to a playlist
   - Set the polling URL to your API server: `http://your-server:3000/metrics`

## Configuration

### Plugin Settings (`src/settings.yml`)

- `polling_url`: Your API endpoint (e.g., `http://localhost:3000/metrics`)
- `refresh_interval`: How often to update (in minutes, default: 60)
- `polling_verb`: HTTP method (default: `get`)

### Development Settings (`.trmnlp.yml`)

- `custom_fields.api_url`: Environment variable for API URL
- `time_zone`: Your local timezone
- `watch`: Files to watch for auto-reload during development

## API Endpoints

- `GET /` - Service information
- `GET /metrics` - System metrics in TRMNL-compatible format

### Sample Response

```json
{
  "merge_variables": {
    "data": {
      "timestamp": "2025-09-28T10:30:00Z",
      "system_name": "server-01",
      "host_info": {
        "hostname": "server-01.local",
        "kernel": "Linux 5.15.0",
        "cpu_model": "Intel Xeon",
        "beszel_version": "0.1.0"
      },
      "cpu": {
        "usage_percent": 45.2,
        "cores": 8,
        "threads": 16,
        "load_avg": {
          "load_1m": 1.2,
          "load_5m": 0.8,
          "load_15m": 0.6
        }
      },
      "memory": {
        "usage_percent": 67.5
      },
      "disk": {
        "usage_percent": 23.8,
        "temperature": 42
      },
      "network": {
        "bandwidth_bits": 1024000,
        "bytes_total": 5368709120
      },
      "uptime": {
        "seconds": 432000,
        "formatted": "5d 0h 0m 0s"
      },
      "load_stats": {
        "container_count": 12
      }
    }
  }
}
```

## View Templates

The plugin includes four responsive view templates:

- **Full View** (`src/full.liquid`): Complete dashboard with charts and all metrics
- **Half Horizontal** (`src/half_horizontal.liquid`): Compact horizontal layout
- **Half Vertical** (`src/half_vertical.liquid`): Vertical stack layout  
- **Quadrant** (`src/quadrant.liquid`): Minimal view for small displays

## Development

### Available Scripts

```bash
# API Server
npm start              # Start production server
npm run dev            # Start development server with auto-reload

# TRMNL Plugin Development
npm run trmnlp:serve   # Start TRMNLP development server
npm run trmnlp:build   # Build static HTML files
npm run trmnlp:login   # Authenticate with TRMNL
npm run trmnlp:push    # Upload plugin to TRMNL
npm run trmnlp:pull    # Download plugin from TRMNL
```

### Project Structure

```
.
├── .trmnlp.yml              # TRMNL development config
├── bin/
│   └── trmnlp               # Development script
├── src/                     # TRMNL plugin templates
│   ├── full.liquid          # Full view template
│   ├── half_horizontal.liquid
│   ├── half_vertical.liquid
│   ├── quadrant.liquid      # Compact view template
│   ├── shared.liquid        # Shared template (main dashboard)
│   └── settings.yml         # Plugin configuration
├── server.js                # Node.js API server
├── docker-compose.yml       # Docker deployment
├── Dockerfile              # Container definition
└── package.json            # Node.js dependencies
```

## Troubleshooting

### Common Issues

1. **Plugin shows no data**: 
   - Check API server is running and accessible
   - Verify polling URL in plugin settings
   - Check PocketBase connection and credentials

2. **Authentication errors**:
   - Verify POCKETBASE_EMAIL and POCKETBASE_PASSWORD
   - Ensure PocketBase URL is accessible
   - Check user permissions in PocketBase

3. **Development server won't start**:
   - Install TRMNLP: `gem install trmnl_preview`
   - Or ensure Docker is installed and running
   - Check port 4567 is not in use

### Debug Mode

Enable detailed logging by uncommenting debug lines in `server.js`:

```javascript
console.log('📊 Raw system data:', JSON.stringify(system, null, 2));
console.log('🔍 Available info fields:', Object.keys(info));
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run trmnlp:serve`
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Related Projects

- [Beszel](https://github.com/henrygd/beszel) - Lightweight server monitoring hub
- [PocketBase](https://pocketbase.io/) - Backend as a service
- [TRMNL](https://usetrmnl.com/) - E-ink display platform
