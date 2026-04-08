import {
  collection,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

const WORKERS_COLLECTION = "workers";

function mapWorkerDoc(docSnapshot) {
  return {
    id: docSnapshot.id,
    ...docSnapshot.data(),
  };
}

function isActiveWorker(worker) {
  return worker?.active !== false && worker?.active !== "false";
}

export const subscribeToWorkers = (onData, onError) => {
  const workersRef = collection(db, WORKERS_COLLECTION);

  return onSnapshot(
    workersRef,
    (snapshot) => {
      onData?.(
        snapshot.docs
          .map(mapWorkerDoc)
          .filter(isActiveWorker)
      );
    },
    (error) => {
      console.error("Workers listener error:", error);
      onError?.(error);
    }
  );
};

export const fetchActiveWorkers = async () => {
  const snapshot = await getDocs(collection(db, WORKERS_COLLECTION));
  return snapshot.docs
    .map(mapWorkerDoc)
    .filter(isActiveWorker);
};

export const subscribeToWorkerProfile = (uid, onData, onError) => {
  if (!uid) {
    onData?.(null);
    return () => {};
  }

  const workerRef = collection(db, WORKERS_COLLECTION);

  return onSnapshot(
    workerRef,
    (snapshot) => {
      const worker = snapshot.docs.find((docSnapshot) => docSnapshot.data()?.uid === uid);
      onData?.(worker ? mapWorkerDoc(worker) : null);
    },
    (error) => {
      console.error(`Worker profile listener error (${uid}):`, error);
      onError?.(error);
    }
  );
};
