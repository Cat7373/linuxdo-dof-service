import koaRoute from '@koa/router'
import { useUserController } from '../controller/user.js'

const routers = new koaRoute()
const controller = useUserController()

routers.post('/registerDnfAccount', controller.registerDnfAccount.bind(controller))
routers.post('/changeDnfPassword', controller.changeDnfPassword.bind(controller))
routers.get('/listCharac', controller.listCharac.bind(controller))
routers.post('/bindCharac', controller.bindCharac.bind(controller))
routers.get('/info', controller.info.bind(controller))

export default routers