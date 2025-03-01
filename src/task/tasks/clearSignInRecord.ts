import { usePrisma } from "../../db/index.js"

/**
 * 每月初清理签到记录
 */
export const clearSignInRecord = async () => {
  await usePrisma().userSignInRecord.deleteMany()
}
