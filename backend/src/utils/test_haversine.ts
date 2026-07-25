import { calculateHaversineDistance } from "./haversine.js";
console.log("Valid:", calculateHaversineDistance(27.7, 85.3, 27.71, 85.31));
console.log("Missing lat:", calculateHaversineDistance(27.7, 85.3, undefined, 85.31));
console.log("Missing both:", calculateHaversineDistance(27.7, 85.3, undefined, undefined));
