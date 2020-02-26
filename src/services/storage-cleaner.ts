import { Observable, combineLatest, from } from 'rxjs'
import { map, take, switchMap, tap } from 'rxjs/operators'
import { sqlDatabase$, sendQuery$ } from '../utils/sql-helper'
import { blobList$, setContainer$, blobBatch$, blobUrl, extractString } from '../utils/storage-helper'
import { BlobItem, StorageSharedKeyCredential } from '@azure/storage-blob'

export const find$ = (datasource: Array<{ tableName: string, columnName: string }>, containerName: string) => new Observable<[BlobItem[], string[]]>(sub => {
    sub.add(
        combineLatest(
            blobList$,
            sqlDatabase$.pipe(
                map(res => res.map<string>(el => el[datasource[0].columnName].value)),
                map(res => res.filter(el => el != null)),
            )
        ).subscribe(res => sub.next(res), err => sub.error(err), () => sub.complete())
    )

    let query = datasource.reduce((acc, cur) => 
        acc.concat(`select ${cur.columnName} from ${cur.tableName} union `
    ), '')
    query = query.substring(0, query.length - 7)
    setContainer$.next(containerName)
    sendQuery$.next(query)
}).pipe(
    map(res => res[0].reduce<BlobItem[]>((acc, cur) => res[1].includes(cur.name) ? acc : [ ...acc, cur ], []))
)

export const clear$ = (datasource: Array<{ tableName: string, columnName: string }>, containerName: string) => find$(datasource, containerName).pipe(
    tap(res => console.log(`Preparing to delete ${res.length} blobs`)),
    map(res => res.map(el => blobUrl(containerName, el.name))),
    switchMap(res => blobBatch$.pipe(
        switchMap(x => from(
            x.deleteBlobs(
                res, 
                new StorageSharedKeyCredential(
                    extractString('AccountName'),
                    extractString('AccountKey')
                )
            )
        ))
    )),
    take(1)
)