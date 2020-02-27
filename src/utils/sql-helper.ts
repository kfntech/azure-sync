import { Observable, Subject, combineLatest, fromEventPattern, of } from 'rxjs'
import { map, switchMap, share, combineAll, takeUntil, tap } from 'rxjs/operators'
import { Connection, Request, ColumnValue, ConnectionConfig } from 'tedious'

export const sendQuery$ = new Subject<string>()
export const setServer$ = new Subject<ConnectionConfig>()
export const rowCount$ = new Subject<number>()

export const sqlDatabase$ = new Observable<Request>(sub => {
    let connection: Connection

    setServer$.pipe(
        map(res => new Connection(res)),
        tap(res => {
            connection && connection.close()
            connection = res
        }),
        switchMap(res => combineLatest(
            fromEventPattern<void>(
                handler => connection.addListener('connect', handler),
                handler => connection.removeListener('connect', handler),
            ),
            sendQuery$.pipe(
                map(x => new Request(x, (err, rowCount) => err ? sub.error(err.message) : rowCount$.next(rowCount))),
            )
        ))
    ).subscribe(res => {
        sub.next(res[1])
        connection.execSql(res[1])
    }, err => sub.error(err), () => sub.complete())

    return () => {
        connection.close()
    }
}).pipe(
    share()
)

export const queryRows$ = sqlDatabase$.pipe(
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
    tap(res => Array.isArray(res) ? console.log(`${res.length} table rows fetched`) : console.log(res)),
)

export const azureConnectionString = () => `-S ${extractString('Server')} -U ${extractString('User ID')} -P ${extractString('Password')} -d ${extractString('Initial Catalog')}`

export const mirrorConnectionString = () => `-S ${process.env.MIRROR_SQL_SERVER} -U ${process.env.MIRROR_SQL_USERNAME} -P ${process.env.MIRROR_SQL_PASSWORD} -d ${process.env.MIRROR_SQL_DATABASE}`

export const azureConnectionConfig = (): ConnectionConfig => ({
    authentication: {
        options: {
            userName: extractString('User ID'),
            password: extractString('Password')
        },
        type: "default"
    },
    server: extractString('Server'),
    options: {
        database: extractString('Initial Catalog'),
        encrypt: true
    }
})

export const mirrorConnectionConfig = (): ConnectionConfig => ({
    authentication: {
        options: {
            userName: process.env.MIRROR_SQL_USERNAME,
            password: process.env.MIRROR_SQL_PASSWORD
        },
        type: "default"
    },
    server: process.env.MIRROR_SQL_SERVER,
    options: {
        database: process.env.MIRROR_SQL_DATABASE,
        encrypt: true
    }
})

// Extracts the value of provided key from 
const extractString = (key: string) => {
    const chunk = process.env.AZURE_SQL_CONNECTION_STRING!.split(';').find(el => el.startsWith(key))!
    const value = chunk.slice(chunk.indexOf('=') + 1, chunk.length)
    return key == 'Server' ? value.replace('tcp:', '').split(',')[0] : value
}