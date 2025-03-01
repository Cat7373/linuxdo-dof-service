import koaRoute from '@koa/router'
import { dev } from '../controller/dev.js'

const routers = new koaRoute()

routers.get('/dev', dev)

export default routers