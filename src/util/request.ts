import axios from 'axios'

const instance = axios.create({
  timeout: 30 * 1000,
  baseURL: '', // 请勿修改
})

export default instance