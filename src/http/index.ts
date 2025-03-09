import koaCors from '@koa/cors'
import koaSession from 'koa-session'
import koaBodyParser from 'koa-bodyparser'
import Koa from 'koa'
import routers from './routers/index.js'
import { useLog } from '../util/log.js'
import config from '../config/index.js'
import { useResult } from '../util/result.js'
import { useEnv } from '../util/env.js'
import { useSession } from './util/index.js'

const AUTH_WHITE_LIST = [
  '/api/dev/dev',
  '/api/login/info',
  '/api/login/linuxdoAuthUrl',
  '/api/login/linuxdo',
  '/api/login/logout',
]

/**
 * 启动 HTTP 服务
 */
export async function useHttpService() {
  const app = new Koa()
  app.keys = [useEnv().httpSecret]
  app
    // 允许跨域请求
    .use(koaCors({ origin: '*', credentials: true }))
    // 参数解析
    .use(koaBodyParser())
    // 使用 Session 储存状态
    .use(koaSession({
      maxAge: config.http.sessionTimeoutDays * 86400 * 1000,
      renew: false, // 强制过期，以刷新 LinuxDo 数据
      secure: false, // Nginx 负责
    }, app))
    // 登陆检查
    .use(async (ctx, next) => {
      // 白名单不检查
      if (AUTH_WHITE_LIST.includes(ctx.path)) {
        return await next()
      }

      // 检查是否已经登陆
      if (!ctx.session?.uid) {
        return ctx.body = useResult().fail('登陆过期，请重新登陆', -2)
      }

      // 禁止登录的账号
      if (config.banList.find(banUser => banUser.linuxDoUid === useSession(ctx)!.linuxDoUid)) {
        ctx.session = null
        return ctx.body = useResult().fail('您的账号已被封禁，请私信论坛 Cat73 或回贴沟通', -2)
      }

      return await next()
    })
    // 包装接口返回值、出错时用标准返回结构
    .use(async (ctx, next) => {
      try {
        // 正常执行
        const result = await next()
        // 若有返回值，设置返回值
        if (result) {
          ctx.body = result
        }
        return result
      } catch (e) {
        // 出错时返回标准错误
        useLog().error('HTTPServer', e)
        ctx.body = useResult().fail('服务内部错误', -3)
      }
    })
    // 请求路由
    .use(routers.routes())
    .use(routers.allowedMethods())
    // 监听服务端口
    .listen(config.http.port, config.http.listen)

  useLog().info('HTTP', `HTTP Server is start at port ${config.http.listen}:${config.http.port}`)
}
