
import MyWorker from '@/worker?worker';

// ******************* 与worker的交互逻辑，主页面可以调用work方法让work执行相应的任务 **********************
const worker = new MyWorker()
const worksQueue: Record<string, Function> = {}
const listeners: Record<string, Function> = {}

/**
 * 向工作者线程发起请求以执行命令
 */
export function work<T>(command: string, data: Record<string, any>) {
   return new Promise<ServResponse<T>>((solve) => {
      const id = Math.random() + ''
      worker.postMessage({ id, command, data })
      worksQueue[id] = solve
      setTimeout(() => {
         delete worksQueue[id]
         // @ts-ignore
         solve({ status: false, data: 'timeout' })
      }, 15_000)
   })
}

/**
 * 添加处理工作者线程发起的请求
 */
export function listen(channel: string, listener: (data: Record<string, any>) => any) {
   if (channel in listeners) throw Error(`listener channel: ${channel} has exsited.`)
   listeners[channel] = listener
}

worker.addEventListener('message', async (ev) => {
   const { id, data, status, channel } = ev.data
   if (id in worksQueue) {
      // 处理worker线程的响应数据
      worksQueue[id]({ status, data })
      delete worksQueue[id]
   } else if (channel in listeners) {
      // 处理worker线程的请求
      const res: Record<string, any> = {
         id,
         data: '没有该通道：' + id,
         status: false
      }
      if (!(channel in listeners))
         return worker.postMessage(res)
      try {
         res.data = await listeners[channel](data)
         res.status = true
      } catch (error) {
         res.data = error
      } finally {
         worker.postMessage(res)
      }
   }
})

/**
 * 为worker传递主进程的port
 */
window.addEventListener('message', (ev) => {
   if (ev.data !== 'establish-port-worker-pass') return
   if (ev.ports[0]) {
      const trans = [ev.ports[0]]
      worker.postMessage('give you port', trans)
   }
})
