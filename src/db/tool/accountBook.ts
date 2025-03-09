import { AccountBookType, AccountLogType, Prisma } from '@prisma/client'
import { usePrisma, usePrismaTx } from '../index.js'

/**
 * 校验小数不能超过 2 位
 * @param {Decimal} num 数字
 * @returns 数字本身
 */
function checkDp(num: Prisma.Decimal) {
  if (num.dp() > 2) throw new Error(`'${num}'.dp() > 2`)
  return num
}

/**
 * 账本操作工具
 * 注意，涉及 ID 的部分，必须传递 0 ~ 4294967295 之间的整数值
 * 其余数值可能引起意料之外的行为，仅在此做提示，工具内部未做检查
 */
class AccountBookTool {
  /**
     * 根据实体的 ID 和账本类型获取账本
     * @param oid 实体的 ID
     * @param type 账本类型
     * @param extId 账本的扩展 ID
     * @param create 如果账本不存在，是否自动创建
     * @returns 账本，如果账本不存在且 create 设置为 false，则返回 null
     */
  async getBook(oid: number, type: AccountBookType, extId=0, create=true) {
    return usePrismaTx(async () => {
      // 尝试查找账本
      let book = await usePrisma().accountBook.findUnique({
        where: {
          oid_type_extId: {
            oid, type, extId,
          },
        }
      })

      // 如果不存在且要求创建，则尝试创建
      if (!book && create) {
        book = await usePrisma().accountBook.create({
          data: {
            oid,
            type,
            extId,
            addtime: new Date(),
            balance: '0.0',
          },
        })
      }

      // 返回结果
      return book
    })
  }

  /**
   * 查询余额
   * @param oid 实体的 ID
   * @param type 账本类型
   * @param extId 账本的扩展 ID
   * @returns 账本余额
   */
  async balanceOf(oid: number, type: AccountBookType, extId=0) {
    const book = (await this.getBook(oid, type, extId))!
    return book.balance
  }

  /**
   * 判断是否能够扣一定金
   * @param oid 实体的 ID
   * @param type 账本类型
   * @param money
   * @param extId 账本的扩展 ID
   * @returns 是否能够扣款
   */
  async hasCharge(oid: number, type: AccountBookType, money: Prisma.Decimal, extId=0) {
    checkDp(money)
    return (await this.balanceOf(oid, type, extId)).gte(money)
  }

  /**
   * 构建一个记账工具
   * @param defaultOid 默认的实体 ID
   * @param allowNegative 是否允许操作结果为负数
   * @param ignoreZero 是否忽略零金额操作(如最终无有效纪录，则直接忽略本次操作，DB 内不会做任何更新)
   * @returns 记账工具实例
   */
  items(defaultOid=0, allowNegative=false, ignoreZero=true) {
    return new AccountBookItemBuilder(defaultOid, allowNegative, ignoreZero)
  }
}

/**
 * 记账中间过程存储的 Item 数据结构
 */
interface ItemRecord {
  oid: number, // 实体的 ID
  extId: number, // 扩展 ID
  type: AccountBookType, // 账本类型
  amount: Prisma.Decimal, // 变更额
}

/**
 * 记账工具
 */
class AccountBookItemBuilder {
  // 默认的 oid
  private defaultOid: number
  // 是否允许操作结果为负数
  private allowNegative: boolean
  // 是否忽略零金额操作(如最终无纪录，同时忽略本次操作)
  private ignoreZero: boolean
  // 是否已经调用过终结方法
  private over = false
  // 操作清单
  private items: Array<ItemRecord> = []

  /**
   * 构造一个记账工具
   * @param defaultOid 默认的 Oid
   * @param allowNegative 是否允许操作结果为负数
   * @param ignoreZero 是否忽略零金额操作(如最终无纪录，同时忽略本次操作)
   */
  constructor(defaultOid: number, allowNegative: boolean, ignoreZero: boolean) {
    this.defaultOid = defaultOid
    this.allowNegative = allowNegative
    this.ignoreZero = ignoreZero
  }

  /**
   * 记录一条账目操作
   * @param type 账本类型
   * @param amount 操作金额
   * @param extId 账本的扩展 ID
   * @param oid 实体的 ID
   * @returns 自身实例，用于链式调用
   */
  item(type: AccountBookType, amount: Prisma.Decimal, extId=0, oid=this.defaultOid) {
    const change = checkDp(amount)
    if (!this.ignoreZero || !change.isZero()) {
      this.items.push({ amount: change, type, extId, oid })
    }
    return this
  }

  /**
   * 完成记账，整理结果入库
   * @param source 操作源信息，可以是 ID，可以是名字，也可以是其他内容，可根据业务自行设定
   * @param type 操作类型
   * @param note 备注
   * @returns 交易日志的 ID
   */
  async log(source: string, type: AccountLogType, note='') {
    // 安全校验
    if (this.over) throw new Error('已经调用过 log 方法.')
    this.over = true

    // 处理无操作的情况
    if (this.items.length === 0) {
      if (this.ignoreZero) return // 允许忽略时，不做任何操作
      throw new Error('完成记账时，无任何账目操作') // 不允许忽略时，直接抛错，提醒码农排 bug
    }

    // 当前时间 - 统一交易中所有记录的时间
    const now = new Date()

    return await usePrismaTx(async () => {
      // 记录交易日志
      const log = await usePrisma().accountBookLog.create({
        data: {
          source,
          type,
          note,
          addtime: now
        }
      })

      // 记录交易明细并操作账本余额
      for (let item of this.items) {
        const { amount: change, type: bookType, extId, oid } = item

        // 查出账本
        const book = (await useAccountBookTool().getBook(oid, bookType, extId))!

        // 计算交易前后的金额
        const origin = book.balance
        const result = origin.add(change)

        // 安全检查 - 负数
        if (!this.allowNegative && result.isNegative()) {
          throw new Error(`账本操作中默认不允许出现负数, bookType: ${bookType}, origin: ${origin}, result: ${result}`)
        }

        // 更新账本
        await usePrisma().accountBook.update({
          where: { id: book.id },
          data: { balance: result },
        })

        // 保存交易记录
        await usePrisma().accountBookItem.create({
          data: {
            oid,
            bookId: book.id,
            logId: log.id,
            origin: origin,
            change: change,
            result: result,
            addtime: now
          },
        })
      }

      // 返回交易日志 ID
      return log.id
    })
  }
}

const instance = new AccountBookTool()
export function useAccountBookTool() {
  return instance
}
