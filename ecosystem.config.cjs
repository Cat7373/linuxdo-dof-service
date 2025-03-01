module.exports = {
  apps: [{
    name: 'linuxdo-dof-service',
    script: 'built/main.js',
    wait_ready: true,
    listen_timeout: 60000,
    cron_restart: '55 4 * * *',
  }],
}
