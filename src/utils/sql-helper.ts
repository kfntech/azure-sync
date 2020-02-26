import { Observable, Subject, combineLatest, fromEventPattern, of } from 'rxjs'
import { map, switchMap, share, combineAll, takeUntil, tap } from 'rxjs/operators'
import { Connection, Request, ColumnValue } from 'tedious'

export const sendQuery$ = new Subject<string>()
const rowCount$ = new Subject<number>()

export const sqlDatabase$ = new Observable<Request>(sub => {
    const connection = new Connection({
        authentication: {
            options: {
                userName: process.env.SQL_USERNAME!,
                password: process.env.SQL_PASSWORD!
            },
            type: "default"
        },
        server: process.env.SQL_SERVER!,
        options: {
            database: process.env.SQL_DATABASE!,
            encrypt: true
        }
    })

    combineLatest(
        fromEventPattern<void>(
            handler => connection.addListener('connect', handler),
            handler => connection.removeListener('connect', handler),
        ),
        sendQuery$.pipe(
            map(x => new Request(x, (err, rowCount) => err ? sub.error(err.message) : rowCount$.next(rowCount))),
        )
    ).subscribe(res => {
        sub.next(res[1])
        connection.execSql(res[1])
    }, err => sub.error(err), () => sub.complete())

    return () => {
        connection.close()
    }
}).pipe(
    switchMap(res => fromEventPattern<ColumnValue[]>(
        handler => res.addListener('row', handler),
        handler => res.removeListener('row', handler)
    ).pipe(
        takeUntil(rowCount$),
        map(res => of(
            res.reduce<{ [key: string]: ColumnValue }>((acc, cur) => { 
                acc[cur.metadata.colName] = cur; 
                return acc; 
            }, {})
        )),
        combineAll<{ [key: string]: ColumnValue }>()
    )),
    tap(res => console.log(`${res.length} table rows fetched`)),
    share()
)

export const connectionString = () => `-S ${process.env.SQL_SERVER!} -U ${process.env.SQL_USERNAME!} -P ${process.env.SQL_PASSWORD!} -d ${process.env.SQL_DATABASE!}`