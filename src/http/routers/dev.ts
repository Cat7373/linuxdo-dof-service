import koaRoute from '@koa/router'
import { useDevController } from '../controller/dev.js'

const routers = new koaRoute()
const controller = useDevController()

routers.get('/dev', controller.dev.bind(controller))

export default routers