"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256Hex = sha256Hex;
exports.fileJsonSlug = fileJsonSlug;
const crypto_1 = require("crypto");
function sha256Hex(content) {
    return (0, crypto_1.createHash)('sha256').update(content, 'utf8').digest('hex');
}
function fileJsonSlug(relativePath) {
    const h = sha256Hex(relativePath).slice(0, 16);
    const safe = relativePath.replace(/[^a-zA-Z0-9-_.]/g, '_').slice(-96);
    return `${h}_${safe}`;
}
//# sourceMappingURL=hash.js.map