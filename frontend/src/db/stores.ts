import { getDatabase, STORES, type StoreName } from "./database";

function tx<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return getDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORES[storeName], mode);
        const request = run(transaction.objectStore(STORES[storeName]));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
  );
}

export async function dbGetAll<T>(storeName: StoreName): Promise<T[]> {
  return tx<T[]>(storeName, "readonly", (store) => store.getAll() as IDBRequest<T[]>);
}

export async function dbGet<T>(storeName: StoreName, key: IDBValidKey): Promise<T | undefined> {
  return tx<T | undefined>(storeName, "readonly", (store) => store.get(key) as IDBRequest<T | undefined>);
}

export async function dbPut<T>(storeName: StoreName, value: T): Promise<T> {
  await tx<IDBValidKey>(storeName, "readwrite", (store) => store.put(value));
  return value;
}

export async function dbPutMany<T>(storeName: StoreName, values: T[]): Promise<T[]> {
  const db = await getDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORES[storeName], "readwrite");
    const store = transaction.objectStore(STORES[storeName]);
    values.forEach((value) => store.put(value));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  return values;
}

export async function dbBulkWrite(entries: Partial<Record<StoreName, unknown[]>>): Promise<void> {
  const names = (Object.keys(entries) as StoreName[]).filter((name) => (entries[name]?.length ?? 0) > 0);
  if (names.length === 0) return;
  const db = await getDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(names.map((name) => STORES[name]), "readwrite");
    names.forEach((name) => {
      const store = transaction.objectStore(STORES[name]);
      (entries[name] ?? []).forEach((value) => store.put(value));
    });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function dbCount(storeName: StoreName): Promise<number> {
  return tx<number>(storeName, "readonly", (store) => store.count());
}
