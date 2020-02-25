"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = __importDefault(require("dotenv"));
var path_1 = require("path");
var sql_helper_1 = require("./services/sql-helper");
var result = dotenv_1.default.config({ path: path_1.resolve(__dirname, '../.env') });
if (result.error)
    throw result.error;
sql_helper_1.test();
// .then(() => console.log('Done'))
// .catch((ex) => console.log(ex.message));
console.log('finished');
// sqlDatabase$.pipe(
//     tap(res => console.log(res))
// ).subscribe()
// setQuery$.next(`SELECT * FROM [dbo].[PatricioPersonalMoments]`)
