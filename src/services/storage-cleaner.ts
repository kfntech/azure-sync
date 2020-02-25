import { Observable, combineLatest, from } from 'rxjs'
import { map, take, switchMap, tap } from 'rxjs/operators'
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
    tap(res => console.log(`Preparing to delete ${res.length} blobs`)),
    map(res => res.map(el => blobUrl(containerName, el.name))),
    switchMap(res => blobBatch$.pipe(
        switchMap(x => from(
            x.deleteBlobs(
                res, 
                new StorageSharedKeyCredential(
                    process.env.AZURE_STORAGE_ACCOUNT_NAME!,
                    process.env.AZURE_STORAGE_ACCOUNT_KEY!
                )
            )
        ))
    )),
    take(1)
)