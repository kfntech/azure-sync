import { Observable, combineLatest, from } from 'rxjs'
import { map, take, tap, switchMap } from 'rxjs/operators'
import { sqlDatabase$, sendQuery$ } from '../utils/sql-helper'
import { blobList$, setContainer$, blobBatch$, blobUrl } from '../utils/storage-helper'
import { BlobItem, StorageSharedKeyCredential } from '@azure/storage-blob'

export const find = (datasource: Array<{ tableName: string, columnName: string }>, containerName: string) => new Observable<BlobItem[]>(sub => {
    combineLatest(
        blobList$,
        sqlDatabase$.pipe(
            map(res => res.map<string>(el => el[datasource[0].columnName].value)),
            map(res => res.filter(el => el != null)),
        )
    ).pipe(
        map(res => res[0].reduce<BlobItem[]>((acc, cur) => res[1].includes(cur.name) ? acc : [ ...acc, cur ], [])),
        take(1)
    ).subscribe(res => {
        sub.next(res)
        sub.complete()
    })

    let query = datasource.reduce((acc, cur) => 
        acc.concat(`select ${cur.columnName} from ${cur.tableName} union `
    ), '')
    query = query.substring(0, query.length - 7)
    setContainer$.next(containerName)
    sendQuery$.next(query)
})

export const clear = (datasource: Array<{ tableName: string, columnName: string }>, containerName: string) => find(datasource, containerName).pipe(
    map(res => res.map(el => blobUrl(containerName, el.name))),
    switchMap(res => blobBatch$.pipe(
        map(x => x.deleteBlobs(res, new StorageSharedKeyCredential(
            process.env.AZURE_STORAGE_ACCOUNT_NAME!,
            process.env.AZURE_STORAGE_ACCOUNT_KEY!
        )))
    ))
)

export const test = () => {
    const target = 'MUSIC_COVER_637173775459482412'
    const cred = new StorageSharedKeyCredential(
        process.env.AZURE_STORAGE_ACCOUNT_NAME!,
        process.env.AZURE_STORAGE_ACCOUNT_KEY!
    )
    blobBatch$.pipe(
        switchMap(res => from(res.deleteBlobs([target], cred))),
        take(1),
    ).subscribe(res => console.log(res))
}