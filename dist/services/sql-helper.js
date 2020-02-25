"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tedious_1 = require("tedious");
exports.test = function () {
    console.log('here');
    // return new Promise((resolve, reject) => {
    //     // Attempt to connect and execute queries if connection goes through
    //     connection.on("connect", err => {
    //         if (err) {
    //             console.error(err.message);
    //             reject()
    //         } else {
    //             queryDatabase().then(() => resolve());
    //         }
    //     });
    // })
};
// Create connection to database
var config = {
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
};
var connection = new tedious_1.Connection(config);
function queryDatabase() {
    console.log("Reading rows from the Table...");
    return new Promise(function (resolve, reject) {
        // Read all rows from table
        var request = new tedious_1.Request("SELECT * FROM [dbo].[PatricioPersonalMoments]", function (err, rowCount) {
            if (err) {
                console.error(err.message);
                reject();
            }
            else {
                console.log(rowCount + " row(s) returned");
                resolve();
            }
        });
        request.on("row", function (columns) {
            // resolve(columns)
            columns.forEach(function (column) {
                console.log("%s\t%s", column.metadata.colName, column.value);
            });
        });
        connection.execSql(request);
    });
}
