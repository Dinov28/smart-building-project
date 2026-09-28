const axios = require("axios");

const TOTAL_REQUESTS = 1000;

const buildings = [
    "Melbourne",
    "Geelong",
    "Ballarat",
    "Bendigo"
];

function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function sendRequest(i) {
    const payload = {
        building: randomItem(buildings),
        floor: randomInt(1, 4),
        room: `${randomInt(1, 4)}.${randomInt(1, 20)
            .toString()
            .padStart(2, "0")}`,
        temperature: randomInt(18, 35),
        humidity: randomInt(35, 90)
    };

    const start = Date.now();

    try {
        await axios.post(
            "http://127.0.0.1:3000/environment",
            payload
        );

        return {
            success: true,
            latency: Date.now() - start
        };

    } catch (error) {
        return {
            success: false,
            latency: Date.now() - start
        };
    }
}

async function runLoadTest() {
    console.log("\nStarting load test...");
    console.log(`Total requests: ${TOTAL_REQUESTS}`);

    const startTime = Date.now();

    const requests = [];

    for (let i = 1; i <= TOTAL_REQUESTS; i++) {
        requests.push(sendRequest(i));
    }

    const results = await Promise.all(requests);

    const totalTime = Date.now() - startTime;

    const successful =
        results.filter(result => result.success).length;

    const failed =
        results.filter(result => !result.success).length;

    const latencies =
        results
            .filter(result => result.success)
            .map(result => result.latency)
            .sort((a, b) => a - b);

    const averageLatency =
        latencies.length > 0
            ? latencies.reduce((a, b) => a + b, 0) /
              latencies.length
            : 0;

    const p95Index =
        Math.floor(latencies.length * 0.95);

    const p95Latency =
        latencies.length > 0
            ? latencies[
                Math.min(p95Index, latencies.length - 1)
              ]
            : 0;

    const requestsPerSecond =
        TOTAL_REQUESTS / (totalTime / 1000);

    console.log("\n===== LOAD TEST RESULTS =====");
    console.log(`Requests sent        : ${TOTAL_REQUESTS}`);
    console.log(`Successful requests  : ${successful}`);
    console.log(`Failed requests      : ${failed}`);
    console.log(`Total time           : ${totalTime} ms`);
    console.log(
        `Requests per second  : ${requestsPerSecond.toFixed(2)}`
    );
    console.log(
        `Average latency      : ${averageLatency.toFixed(2)} ms`
    );
    console.log(`p95 latency          : ${p95Latency} ms`);
    console.log("=============================\n");
}

runLoadTest();