import { createWorker, type Worker } from "tesseract.js";

export type RawOcrResult = {
  text: string;
  confidence: number;
};

let workerPromise: Promise<Worker> | null = null;

function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker("kor+eng");
  }

  return workerPromise;
}

export async function recognizeBillImage(file: File): Promise<RawOcrResult> {
  const worker = await getWorker();
  const { data } = await worker.recognize(file);

  return { text: data.text, confidence: data.confidence };
}
