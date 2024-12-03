module.exports = {
  apps: [{
    name: 'nostr-auth-middleware',
    script: 'dist/src/server.js',
    instances: 1,
    exec_mode: 'cluster',
    watch: ['dist'],
    ignore_watch: ['node_modules', 'logs'],
    node_args: '--experimental-specifier-resolution=node --es-module-specifier-resolution=node',
    env: {
      NODE_ENV: 'development',
      PORT: 3002,
      TEST_MODE: 'true',
      LOG_LEVEL: 'debug',
      SERVER_PRIVATE_KEY: 'b97258b86388c8374693bab215a5e7055098a1acd86a9ef1c0a62b93ef09f1d8',
      CORS_ORIGINS: 'http://localhost:3000,http://localhost:3001',
      NOSTR_RELAYS: 'wss://relay.maiqr.app,wss://relay.damus.io,wss://relay.nostr.band',
      KEY_MANAGEMENT_MODE: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3002,
      TEST_MODE: 'false',
      KEY_MANAGEMENT_MODE: 'production'
    },
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    combine_logs: true,
    merge_logs: true,
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    max_memory_restart: '1G',
    autorestart: true,
    max_restarts: 10,
    restart_delay: 4000,
    // Log rotation configuration
    log_rotate_interval: '1d',    // Rotate logs daily
    log_rotate_max_size: '10M',   // Rotate when size exceeds 10MB
    log_rotate_keep: 15           // Keep last 15 rotated files
  }]
};
