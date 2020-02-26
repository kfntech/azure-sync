import { Observable, Subject, combineLatest, fromEventPattern, of } from 'rxjs'
import { map, switchMap, share, combineAll, takeUntil, tap } from 'rxjs/operators'
import { Connection, Request, ColumnValue } from 'tedious'

export const sendQuery$ = new Subject<string>()
const rowCount$ = new Subject<number>()

export const sqlDatabase$ = new Observable<Request>(sub => {
    const connection = new Connection({
        authentication: {
            options: {
                userName: extractString('User ID'),
                password: extractString('Password')
            },
            type: "default"
        },
        server: extractString('Server').replace('tcp:', ''),
        options: {
            database: extractString('Initial Catalog'),
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

export const extractString = (key: string) => {
    let chunk = process.env.AZURE_SQL_CONNECTION_STRING!.split(';').find(el => el.startsWith(key))!
    return chunk.slice(chunk.indexOf('='), chunk.length - 1)
}

export const connectionString = (info?: SQLInfo) => info 
    ? `-S ${info.server} -U ${info.username} -P ${info.server} -d ${info.database}` 
    : `-S ${extractString('Server')} -U ${extractString('User ID')} -P ${extractString('Password')} -d ${extractString('Initial Catalog')}`

interface SQLInfo {
    server: string
    username: string
    password: string
    database: string
}