const fs = require("fs");

// Load JSON data from two files
const data1 = JSON.parse(fs.readFileSync("testcase1.json", "utf8"));
const data2 = JSON.parse(fs.readFileSync("testcase2.json", "utf8"));

// Process function to handle each dataset individually
function test(rawData) {
    // Get values of n and k
    const n = rawData.keys.n;
    const k = rawData.keys.k;

    // Decode points from JSON data
    let points = [];
    for (let item in rawData) {
        if (item !== "keys") {
            const base = parseInt(rawData[item].base);
            const value = parseInt(rawData[item].value, base);
            points.push({ x: parseInt(item), y: value });
        }
    }

    // Function to get polynomial coefficients using Lagrange Interpolation
    function lagrangeInterpolation(xVals, yVals) {
        const length = xVals.length;
        let coefficients = new Array(length).fill(0);

        // Calculate Lagrange polynomial for each point
        for (let i = 0; i < length; i++) {
            let term = new Array(length).fill(1);

            for (let j = 0; j < length; j++) {
                if (i !== j) {
                    let divisor = xVals[i] - xVals[j];
                    for (let m = length - 1; m >= 0; m--) {
                        term[m] *= -xVals[j];
                        if (m > 0) term[m] += term[m - 1];
                    }
                    term = term.map(value => value / divisor);
                }
            }

            for (let m = 0; m < length; m++) {
                coefficients[m] += yVals[i] * term[m];
            }
        }
        return coefficients;
    }

    // Function to detect outliers based on residuals (difference from expected value)
    function findOutliers(xVals, yVals) {
        let residuals = [];

        for (let i = 0; i < xVals.length; i++) {
            const xSample = xVals.filter((_, idx) => idx !== i);
            const ySample = yVals.filter((_, idx) => idx !== i);
            const coefs = lagrangeInterpolation(xSample, ySample);

            let estimated = 0;
            for (let j = 0; j < coefs.length; j++) {
                estimated += coefs[j] * Math.pow(xVals[i], j);
            }
            residuals.push(Math.abs(yVals[i] - estimated));
        }

        const meanResidual = residuals.reduce((sum, r) => sum + r, 0) / residuals.length;
        const threshold = meanResidual * 2;

        return residuals.map(res => res > threshold);
    }

    // Separate x and y values from points
    const xVals = points.map(p => p.x);
    const yVals = points.map(p => p.y);

    // Identify and remove outliers
    const outliers = findOutliers(xVals, yVals);
    const filteredX = xVals.filter((_, idx) => !outliers[idx]);
    const filteredY = yVals.filter((_, idx) => !outliers[idx]);

    // Print outlier points
    console.log("Outliers:");
    points.forEach((p, idx) => { if (outliers[idx]) console.log(`x: ${p.x}, y: ${p.y}`); });

    // Calculate polynomial coefficients
    const finalCoefficients = lagrangeInterpolation(filteredX.slice(0, k), filteredY.slice(0, k));

    // Round coefficients and find the secret
    const roundedCoefficients = finalCoefficients.map(coef => Math.round(coef));
    const secret = roundedCoefficients[0];

    console.log("The secret is:", secret);
    console.log("The polynomial equation is:");

    let polynomial = '';
    for (let i = roundedCoefficients.length - 1; i >= 0; i--) {
        if (roundedCoefficients[i] !== 0) {
            polynomial += (polynomial && roundedCoefficients[i] > 0 ? ' + ' : '');
            polynomial += (roundedCoefficients[i] < 0 ? ' - ' : '') + Math.abs(roundedCoefficients[i]);
            polynomial += i > 0 ? 'x' + (i > 1 ? `^${i}` : '') : '';
        }
    }

    console.log(polynomial);
}

// Process each dataset
console.log("Results for Test Case 1:");
test(data1);
console.log("\nResults for Test Case 2:");
test(data2);
