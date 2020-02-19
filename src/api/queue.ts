import bull from 'bull';
import fs from 'fs';
import { EcosetJobRequest } from "./types";

export const queue = new bull<EcosetJobRequest>('ecoset', {
    limiter: {
        max: 9999,             // 3 jobs at a time
        duration: 43200000  // 12 hour maximum limit
    }
});

if (fs.existsSync(__dirname + '/job-processor.ts')) {
    queue.process(5, __dirname + '/job-processor.ts');
} else {
    queue.process(5, __dirname + '/job-processor.js');
}