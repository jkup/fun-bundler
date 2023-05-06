const bundle = require("../src/index.js");
const bundledCode = bundle("./test/samples/index.js");
console.log(bundledCode);
