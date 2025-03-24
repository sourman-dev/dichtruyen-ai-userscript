import workerUrl from './worker.ts?worker&url'
import workerPool from 'workerpool';

const js = `import ${JSON.stringify(new URL(workerUrl, import.meta.url))}`
const blob = new Blob([js], { type: "application/javascript" })
const objURL = URL.createObjectURL(blob)

export default workerPool.pool(objURL, {
    maxWorkers: 10,
    /** @ts-ignore */
    workerOpts: {
      type: import.meta.env.PROD ? undefined : "module"
    }
});