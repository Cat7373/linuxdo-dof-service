import koaRoute from '@koa/router'
import { useSignInController } from '../controller/signIn.js'

const routers = new koaRoute()
const controller = useSignInController()

routers.get('/info', controller.info.bind(controller))
routers.post('/signIn', controller.signIn.bind(controller))

export default routers