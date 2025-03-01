/**
 * 等待一会
 * @param {Number} duration 等待的时间(毫秒)
 */
export function sleep(duration: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, duration))
}
