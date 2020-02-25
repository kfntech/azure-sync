"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var tedious_1 = require("tedious");
exports.setQuery$ = new rxjs_1.Subject();
exports.sqlDatabase$ = new rxjs_1.Observable(function (sub) {
    return sub.next(new tedious_1.Connection({
        authentication: {
            options: {
                userName: "michaelmay",
                password: "Tachyon0430" // update me
            },
            type: "default"
        },
        server: "tcp:destinesiahubdbserver.database.windows.net",
        options: {
            database: "destinesiahub_db",
            encrypt: true
        }
    }));
}).pipe(operators_1.switchMap(function (res) { return rxjs_1.combineLatest(rxjs_1.fromEvent(res, 'connection').pipe(operators_1.mapTo(res)), exports.setQuery$.pipe(operators_1.map(function (x) { return new tedious_1.Request(x, function (err, rowCount) { return err && console.error(err.message); }); }))); }), operators_1.switchMap(function (res) {
    res[0].execSql(res[1]);
    return rxjs_1.fromEvent(res[1], 'row');
}));
