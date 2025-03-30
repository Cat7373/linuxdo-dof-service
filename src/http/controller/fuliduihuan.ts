import { Context } from 'koa'
import { ResultObj, useResult } from '../../util/result.js'
import { usePrisma, usePrismaTx } from '../../db/index.js'
import { CheckInput, useSession } from '../util/index.js'
import dayjs from 'dayjs'
import { useAccountBookTool } from '../../db/tool/accountBook.js'
import { AccountBookType, AccountLogType, Prisma } from '@prisma/client'
import { useUserTool } from '../../db/tool/user.js'
import { sendDnfMail } from '../../util/index.js'
import { useKnexTransaction } from '../../db/knex.js'

// 兑换请求参数
interface BuyBody { goodsId: number, count: number }
// 许愿请求参数
interface WishBody { wish: string }

/**
 * 福利兑换接口
 * /api/fuliduihuan
 */
class FuLiDuiHuanController {
  /**
   * 活动信息
   * GET /api/fuliduihuan/info
   */
  async info(ctx: Context): Promise<ResultObj<any>> {
    // 处理参数
    const uid = useSession(ctx)!.uid

    // 商品清单
    const categorys = await usePrisma().fuLiDuiHuanCategory.findMany({
      include: {
        goods: {
          orderBy: { idx: 'asc' },
        },
      },
      orderBy: { idx: 'asc' },
    })

    // 今日已兑换次数
    const todayCount = await usePrisma().fuLiDuiHuanOrder.groupBy({
      by: [ 'goodsId' ],
      _sum: { count: true },
      where: {
        uid,
        date: dayjs().format('YYYY-MM-DD'),
      },
    })

    // 补充字段
    for (const category of categorys) {
      for (const good of category.goods) {
        const count = todayCount.find(item => item.goodsId === good.id)?._sum.count ?? 0;
        (good as any).todayCount = count;
      }
    }

    // 返回结果
    return useResult().success(categorys)
  }

  /**
   * 兑换
   * POST /api/fuliduihuan/buy
   */
  @CheckInput('goodsId', 'body', { type: 'number' })
  @CheckInput('count', 'body', { type: 'number' })
  async buy(ctx: Context): Promise<ResultObj<any>> {
    // 处理参数
    const { goodsId, count } = ctx.request.body as BuyBody
    const uid = useSession(ctx)!.uid

    return await usePrismaTx(async () => {
      // 查出用户
      const user = (await useUserTool().findById(uid))!
      if (!user.dnfId) {
        return useResult().fail('请先注册 DNF 账号，再使用福利兑换功能')
      }
      if (!user.dnfBindCharacId) {
        return useResult().fail('请先绑定 DNF 角色后，再使用福利兑换功能')
      }

      // 查出商品
      const goods = await usePrisma().fuLiDuiHuanGoods.findUnique({
        where: { id: goodsId },
      })
      if (!goods) return useResult().fail('商品不存在')

      // 检查今日购买次数是否充足
      const todayCount = await usePrisma().fuLiDuiHuanOrder.aggregate({
        _sum: { count: true },
        where: {
          uid,
          date: dayjs().format('YYYY-MM-DD'),
        },
      })
      if ((todayCount?._sum?.count ?? 0) + count >= goods.limit) {
        return useResult().fail('今日剩余次数不足，无法完成兑换')
      }

      // 计算价格
      const totalPrice = new Prisma.Decimal(goods.price * count)

      // 检查剩余积分是否充足
      if (!(await useAccountBookTool().hasCharge(uid, AccountBookType.POINT, totalPrice))) {
        return useResult().fail('积分不足，无法完成兑换')
      }

      // 创建订单
      const order = await usePrisma().fuLiDuiHuanOrder.create({
        data: {
          uid,
          goodsId,
          count,
          addtime: new Date(),
          date: dayjs().format('YYYY-MM-DD'),
        },
      })

      // 扣款
      await useAccountBookTool().items(uid)
        .item(AccountBookType.POINT, totalPrice)
        .log(String(order.id), AccountLogType.FU_LI_DUI_HUAN_PAY, `${user.linuxDoUsername} 兑换 ${goods.name}`)

      // 发货
      await useKnexTransaction(async () => {
        await sendDnfMail(user.dnfBindCharacId!, goods.items as Record<number, number>)
      })

      // 返回结果
      return useResult().success()
    })
  }

  /**
   * 许愿
   * POST /api/fuliduihuan/wish
   */
  @CheckInput('wish', 'body', { type: 'string', len: [1, 240] })
  async wish(ctx: Context): Promise<ResultObj<any>> {
    // 处理参数
    const { wish } = ctx.request.body as WishBody
    const uid = useSession(ctx)!.uid

    // 检查今天是否许愿过
    const todayWish = await usePrisma().fuLiDuiHuanWish.count({
      where: {
        uid,
        date: dayjs().format('YYYY-MM-DD'),
      },
    })
    if (todayWish >= 1) return useResult().fail('您今天已经许过愿了，请明天再许愿')

    // 创建许愿记录
    await usePrisma().fuLiDuiHuanWish.create({
      data: {
        uid,
        wish,
        addtime: new Date(),
        date: dayjs().format('YYYY-MM-DD'),
      },
    })

    // 返回结果
    return useResult().success()
  }
}

const instance = new FuLiDuiHuanController()
export function useFuLiDuiHuanController() {
  return instance
}
