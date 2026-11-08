/**
 * db.js — Lưu trữ IndexedDB (chứa được cả Blob ảnh / video / file 3D)
 * ────────────────────────────────────────────────────────────────────
 * Database "battrang-cms", store "products", khóa = product.ProductID
 * App du khách (../js/app.js) đọc cùng database này khi chạy chế độ mock.
 */

const CmsDB = (() => {
  const DB_NAME = 'battrang-cms';
  const STORE = 'products';
  const VERSION = 1;
  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE, { keyPath: 'product.ProductID' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  /** Chạy 1 thao tác trong transaction, trả về kết quả khi transaction hoàn tất */
  async function run(mode, action) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = action(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  const getAll = () => run('readonly', s => s.getAll());
  const get = (id) => run('readonly', s => s.get(id));
  const put = (record) => run('readwrite', s => s.put(record));
  const remove = (id) => run('readwrite', s => s.delete(id));

  async function seedIfEmpty(records) {
    const all = await getAll();
    if (all.length === 0) {
      for (const r of records) await put(r);
    }
  }

  return { getAll, get, put, remove, seedIfEmpty };
})();

