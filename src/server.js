import express from 'express';
import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// PocketBase configuration
const POCKETBASE_URL = process.env.POCKETBASE_URL;
const POCKETBASE_EMAIL = process.env.POCKETBASE_EMAIL;
const POCKETBASE_PASSWORD = process.env.POCKETBASE_PASSWORD;
const PRIVATE_PLUGIN_URL = process.env.PRIVATE_PLUGIN_URL;

const pb = new PocketBase(POCKETBASE_URL);
console.log(`🔗 Connecting to PocketBase at: ${POCKETBASE_URL}`);

// Middleware
app.use(express.json());

// Authentication function
async function authenticatePB() {
  try {
    await pb.collection('users').authWithPassword(POCKETBASE_EMAIL, POCKETBASE_PASSWORD);
    console.log('✅ Authenticated with PocketBase');
  } catch (error) {
    console.error('❌ Failed to authenticate with PocketBase:', error.message);
    console.error('   PocketBase URL:', POCKETBASE_URL);
    console.error('   Email:', POCKETBASE_EMAIL);
    throw error;
  }
}

// Function to get system metrics from Beszel API via PocketBase
async function getSystemMetrics() {
  try {
    // Get the latest system metrics from the systems collection
    const result = await pb.collection('systems').getList(1, 1, {
      sort: '-created',
      filter: 'status = "up"'
    });

    if (result.items.length === 0) {
      throw new Error('No active systems found');
    }

    const system = result.items[0];
    
    // Extract metrics from the Beszel system record
    const info = system.info || {};
    
    // Debug logging can be enabled by uncommenting the lines below:
    // console.log('📊 Raw system data:', JSON.stringify(system, null, 2));
    // console.log('🔍 Available info fields:', Object.keys(info));
    
    return {
      timestamp: new Date().toISOString(),
      system_id: system.id,
      system_name: system.name || 'Unknown',
      host_info: {
        hostname: info.h || 'Unknown',
        kernel: info.k || 'Unknown',
        cpu_model: info.m || 'Unknown',
        beszel_version: info.v || 'Unknown'
      },
      cpu: {
        usage_percent: info.cpu || 0,
        cores: info.c || 0,
        threads: info.t || 0,
        load_avg: {
          load_1m: info.l1 || 0,
          load_5m: info.l5 || 0,
          load_15m: info.l15 || 0,
          load_array: info.la || []
        }
      },
      memory: {
        usage_percent: info.mp || 0
        // Note: Beszel only provides memory usage percentage, not total memory size
      },
      disk: {
        usage_percent: info.dp || 0,
        temperature: info.dt || 0
      },
      network: {
        bandwidth_bits: info.bb || 0,
        bytes_total: info.b || 0
      },
      uptime: {
        seconds: info.u || 0,
        formatted: formatUptime(info.u || 0)
      },
      load_stats: {
        operating_system: info.os || 0,
        container_count: info.ct || 0
      },
      status: system.status || 'unknown',
      port: system.port || 'unknown',
      last_updated: system.updated || system.created
    };
  } catch (error) {
    console.error('Error fetching system metrics:', error.message);
    throw error;
  }
}

// Helper function to format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

// Routes
app.get('/', (req, res) => {
  res.json({
    service: 'TRMNL Beszel System Metrics API',
    version: '1.0.0',
    endpoints: {
      metrics: '/metrics'
    }
  });
});

app.get('/metrics', async (req, res) => {
  try {
    const metrics = await getSystemMetrics();
    
    // For TRMNL plugin development - return data in the expected format
    const pluginData = {
      merge_variables: {
        data: metrics
      }
    };

    // If PRIVATE_PLUGIN_URL is set, also update the remote TRMNL plugin
    if (PRIVATE_PLUGIN_URL && PRIVATE_PLUGIN_URL !== 'your-plugin-url-here') {
      try {
        const response = await fetch(PRIVATE_PLUGIN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(pluginData)
        });
        
        if (response.ok) {
          console.log('✅ Successfully updated TRMNL plugin');
        } else {
          console.warn(`⚠️ TRMNL API responded with status: ${response.status}`);
        }
      } catch (error) {
        console.warn('⚠️ Failed to update remote TRMNL plugin:', error.message);
      }
    }
    
    // Always return the plugin data format for local development
    res.json(pluginData);
  } catch (error) {
    console.error('Error in /metrics endpoint:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to process system metrics',
      message: error.message
    });
  }
});

// Initialize and start server
async function startServer() {
  // Start the server regardless of PocketBase connection
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 TRMNL Beszel API server running on http://0.0.0.0:${port}`);
    console.log(`📊 Metrics endpoint: http://0.0.0.0:${port}/metrics`);
  });

  // Try to authenticate with PocketBase in the background
  const isConnected = await authenticatePB();
  if (!isConnected) {
    console.log('⚠️  Server started without PocketBase connection');
    console.log('   The service will continue to run but metrics endpoint will return errors');
    console.log('   Check PocketBase URL and credentials');
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();