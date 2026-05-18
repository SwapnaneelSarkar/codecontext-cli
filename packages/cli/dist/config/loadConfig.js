"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadProjectConfig = loadProjectConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const core_1 = require("@codecontext/core");
const CONFIG_NAMES = ['.codecontextrc.json', '.codecontextrc'];
function loadProjectConfig(projectRoot) {
    let merged = JSON.parse(JSON.stringify(core_1.DEFAULT_CONFIG));
    for (const name of CONFIG_NAMES) {
        const p = path.join(projectRoot, name);
        if (fs.existsSync(p)) {
            try {
                const raw = fs.readFileSync(p, 'utf-8');
                const parsed = JSON.parse(raw);
                merged = deepMerge(merged, parsed);
                break;
            }
            catch {
                // ignore invalid config
            }
        }
    }
    return merged;
}
function deepMerge(base, patch) {
    return {
        ...base,
        ...patch,
        include: patch.include ?? base.include,
        exclude: patch.exclude ?? base.exclude,
        llm: { ...base.llm, ...(patch.llm ?? {}) },
        scan: { ...base.scan, ...(patch.scan ?? {}) },
    };
}
//# sourceMappingURL=loadConfig.js.map