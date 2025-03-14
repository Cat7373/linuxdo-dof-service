import koaRoute from '@koa/router'
import devRoute from './dev.js'
import loginRoute from './login.js'
import userRoute from './user.js'
import signInRoute from './signIn.js'
import fuliduihuanRoute from './fuliduihuan.js'

const routers = new koaRoute()

// 开发调试接口
routers.use('/api/dev', devRoute.routes(), devRoute.allowedMethods())
// 登陆接口
routers.use('/api/login', loginRoute.routes(), loginRoute.allowedMethods())
// 用户接口
routers.use('/api/user', userRoute.routes(), userRoute.allowedMethods())
// 签到接口
routers.use('/api/signIn', signInRoute.routes(), signInRoute.allowedMethods())
// 福利兑换接口
routers.use('/api/fuliduihuan', fuliduihuanRoute.routes(), fuliduihuanRoute.allowedMethods())

export default routers