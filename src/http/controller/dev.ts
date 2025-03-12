import { Context } from 'koa'
import { ResultObj, useResult } from '../../util/result.js'
import { useKnex } from '../../db/knex.js'
import { convertDnfString } from '../../util/index.js'
import { koaFirstQueryParam } from '../util/index.js'
import { useTOTP } from '../../util/totp.js'

/**
 * 内部测试接口 - 前端不应该对接此处的任何接口
 * /api/dev
 */
class DevController {
  /**
   * 测试接口
   * GET /api/dev/dev
   */
  async dev(ctx: Context): Promise<ResultObj<any>> {
    return useResult().success()
  }

  /**
   * 查询用户角色列表
   * GET /api/dev/listCharac
   */
  async listCharac(ctx: Context): Promise<ResultObj> {
    // 参数处理
    const { code } = koaFirstQueryParam(ctx.query)

    if (!useTOTP().verifyDebugCode(code!)) {
      return useResult().fail()
    }

    // 查出角色列表
    const characList = (await useKnex().raw(`SELECT m_id, charac_no, HEX(charac_name) AS charac_name FROM taiwan_cain.charac_info`))[0]

    // 转换字符编码
    characList.forEach((item: any) => {
      item.charac_name = convertDnfString(item.charac_name)
    })

    // 返回结果
    return useResult().success(characList)
  }
}

const instance = new DevController()
export function useDevController() {
  return instance
}
