import { parentPort, isMainThread, resourceLimits } from 'worker_threads';
import { WorkerRequest, WorkerResponse } from '.';

if (!isMainThread) {
  parentPort!.on('message', doWork);
}

// Give Node.js a chance to move the memory to the old generation region
const WAIT = 40;

function doWork({ data, port }: WorkerRequest): WorkerResponse {
  const allocateMemory = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          new Array(resourceLimits.maxYoungGenerationSizeMb! * 1024 * 1024)
            .fill('')
            .map((_, idx) => idx) // more unique values prevent aggressive memory compression and hits mem limits faster
        );
      }, WAIT);
    });
  };

  (async function run() {
    const memoryLeak = [];
    for (;;) /* a computer crying */ {

      memoryLeak.push(await allocateMemory());
    }
  })();

  const randomError = Math.random() * 10 > 8 ? 'RANDOM ERROR' : undefined;

  if (randomError) {
    throw new Error(randomError);
  }

  const workerResponse: WorkerResponse = {
    data: `your message back from the worker: ${data}`,
    error: randomError,
  };

  port.postMessage(workerResponse);
  return workerResponse;
}
