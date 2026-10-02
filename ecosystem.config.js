module.exports = {
  apps: [{
    // Name of the application in PM2 process manager list
    name: 'ceylon-gem-backend',

    // The entry point script to start the Node.js server
    script: 'server.js',

    // Utilize all available CPU cores on the host server for maximum performance
    instances: 'max',

    // Run in cluster mode to enable load balancing across CPU cores
    exec_mode: 'cluster',

    // Automatically restart the application if it crashes unexpectedly
    autorestart: true,

    // Disable file change watching in production to reduce CPU overhead
    watch: false,

    // Automatically restart the app if memory consumption exceeds 1 Gigabyte (prevents memory leaks)
    max_memory_restart: '1G',

    // Environment variables passed directly to the application process
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};