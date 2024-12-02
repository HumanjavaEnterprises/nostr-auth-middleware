module.exports = {
  apps: [{
    name: 'nostr-auth-middleware',
    script: 'dist/server.js',
    instances: 1,
    autorestart: true,
    watch: ['dist'],
    max_memory_restart: '1G',
    env: {
      PORT: 3002,
      NODE_ENV: 'development',
      TEST_MODE: 'true',
      LOG_LEVEL: 'debug'
    },
    env_production: {
      PORT: 3002,
      NODE_ENV: 'production',
      TEST_MODE: 'false'
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: 'logs/nostr-auth-error.log',
    out_file: 'logs/nostr-auth-out.log',
    merge_logs: true,
    time: true
  }]
};
