"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var storage_blob_1 = require("@azure/storage-blob");
exports.setContainer$ = new rxjs_1.Subject();
exports.blobContainer$ = new rxjs_1.Observable(function (sub) {
    return sub.next(storage_blob_1.BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING));
}).pipe(operators_1.switchMap(function (res) { return exports.setContainer$.pipe(operators_1.map(function (x) { return res.getContainerClient(x); })); }));
exports.blobList$ = exports.blobContainer$.pipe(operators_1.map(function (res) { return res.listBlobsFlat(); }), operators_1.switchMap(function (iterator) {
    return rxjs_1.from(iterator.next()).pipe(operators_1.expand(function () { return iterator.next(); }), operators_1.filter(function (x) { return !x.done; }), operators_1.map(function (x) { return x.value; }));
}), operators_1.tap(function (res) { return console.log('\t', res.name); }));
