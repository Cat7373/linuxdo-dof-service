import koaRoute from '@koa/router'
import { useLoginController } from '../controller/login.js'

const routers = new koaRoute()
const controller = useLoginController()

routers.get('/info', controller.info.bind(controller))
routers.get('/linuxdoAuthUrl', controller.linuxdoAuthUrl.bind(controller))
routers.get('/linuxdo', controller.linuxdo.bind(controller))
routers.get('/logout', controller.logout.bind(controller))

export default routers