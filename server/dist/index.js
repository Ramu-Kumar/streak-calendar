"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const app_1 = require("./app");
const app = (0, app_1.createApp)();
app.listen(config_1.config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${config_1.config.port}`);
});
//# sourceMappingURL=index.js.map