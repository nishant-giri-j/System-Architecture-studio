const { getProtocolInfo, getTechnologyInfo } = require("./packages/shared/dist/index.js");
console.log(getProtocolInfo("MQTT").overview);
console.log(getTechnologyInfo("pinecone", "database", "Pinecone").overview);
