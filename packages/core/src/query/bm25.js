"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rankFilesByQuery = rankFilesByQuery;
const K1 = 1.5;
const B = 0.75;
function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9_/.\-]+/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 1);
}
function avgDocLen(docs) {
    if (docs.length === 0)
        return 0;
    const total = docs.reduce((a, d) => a + d.length, 0);
    return total / docs.length;
}
/**
 * Lightweight BM25 ranking over file contexts (same idea as CLI query)
 */
function rankFilesByQuery(query, files, topK = 15) {
    const qTerms = tokenize(query);
    if (qTerms.length === 0 || files.length === 0)
        return [];
    const docs = files.map((f) => tokenize([
        f.filePath,
        f.purpose,
        f.summary,
        ...(f.tags ?? []),
        ...f.exports,
        ...f.imports,
        ...f.functions,
    ].join(' ')));
    const N = docs.length;
    const df = new Map();
    for (const d of docs) {
        const seen = new Set(d);
        for (const t of seen) {
            df.set(t, (df.get(t) ?? 0) + 1);
        }
    }
    const avgdl = avgDocLen(docs);
    const scores = [];
    for (let i = 0; i < files.length; i++) {
        const doc = docs[i];
        const dl = doc.length || 1;
        let score = 0;
        const dlNorm = 1 - B + B * (dl / avgdl);
        for (const term of qTerms) {
            const nqi = docs.filter((d) => d.includes(term)).length;
            if (nqi === 0)
                continue;
            const idf = Math.log(1 + (N - nqi + 0.5) / (nqi + 0.5));
            const fqi = doc.filter((t) => t === term).length;
            const num = fqi * (K1 + 1);
            const den = fqi + K1 * dlNorm;
            score += idf * (num / den);
        }
        const textBlob = [
            files[i].summary,
            files[i].purpose,
            files[i].filePath,
        ].join(' ');
        const snippet = textBlob.length > 240 ? `${textBlob.slice(0, 237)}...` : textBlob;
        scores.push({
            filePath: files[i].filePath,
            score,
            summary: files[i].summary,
            snippet,
        });
    }
    return scores
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
}
//# sourceMappingURL=bm25.js.map