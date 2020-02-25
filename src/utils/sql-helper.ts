import { Observable, Subject, combineLatest, fromEventPattern, of } from 'rxjs'
import { map, switchMap, mapTo, share, combineAll, takeUntil } from 'rxjs/operators'
import { Connection, Request, ColumnValue } from 'tedious'

export const sendQuery$ = new Subject<string>()
const rowCount$ = new Subject<number>()

export const sqlDatabase$ = new Observable<Connection>(sub =>
    sub.next(new Connection({
        authentication: {
            options: {
                userName: process.env.AZURE_SQL_USERNAME!,
                password: process.env.AZURE_SQL_PASSWORD!
            },
            type: "default"
        },
        server: process.env.AZURE_SQL_SERVER!,
        options: {
            database: process.env.AZURE_SQL_DATABASE!,
            encrypt: true
        }
    }))
).pipe(
    switchMap(res => 
        combineLatest(
            fromEventPattern<void>(
                handler => res.addListener('connect', handler),
                handler => res.removeListener('connect', handler)
            ).pipe(
                mapTo(res)
            ),
            sendQuery$.pipe(
                map(x => new Request(
                    x, 
                    (err, rowCount) => err ? console.error(err.message) : rowCount$.next(rowCount)
                )),
            )
        )
    ),
    switchMap(res => {
        res[0].execSql(res[1])
        return fromEventPattern<ColumnValue[]>(
            handler => res[1].addListener('row', handler),
            handler => res[1].removeListener('row', handler)
        ).pipe(
            takeUntil(rowCount$),
            map(res => of(
                res.reduce<{ [key: string]: ColumnValue }>((acc, cur) => { 
                    acc[cur.metadata.colName] = cur; 
                    return acc; 
                }, {})
            )),
            combineAll<{ [key: string]: ColumnValue }>()
        )
    }),
    share()
)