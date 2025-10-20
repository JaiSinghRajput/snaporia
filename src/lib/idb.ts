// Minimal IndexedDB helpers for persisting background upload jobs across refreshes

const DB_NAME = 'snaporia-bg'
const STORE = 'jobs'
const VERSION = 1

type JobRecord = {
  id: string
  kind: 'video'
  content: string
  imageUrls?: string[]
  createdAt: number
  blob: Blob
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function idbAddJob(job: JobRecord): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    const store = tx.objectStore(STORE)
    store.put(job)
  })
}

export async function idbDeleteJob(id: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    const store = tx.objectStore(STORE)
    store.delete(id)
  })
}

export async function idbGetAllJobs(): Promise<JobRecord[]> {
  const db = await openDb()
  return await new Promise<JobRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    tx.onerror = () => reject(tx.error)
    const store = tx.objectStore(STORE)
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result as JobRecord[])
    req.onerror = () => reject(req.error)
  })
}

export type { JobRecord }
