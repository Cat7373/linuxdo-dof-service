import koaRoute from '@koa/router'
import { useFuLiDuiHuanController } from '../controller/fuliduihuan.js'

const routers = new koaRoute()
const controller = useFuLiDuiHuanController()

routers.get('/info', controller.info.bind(controller))
routers.post('/buy', controller.buy.bind(controller))
routers.post('/wish', controller.wish.bind(controller))

export default routers