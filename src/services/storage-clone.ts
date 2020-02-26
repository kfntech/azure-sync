import { Observable, of, from, combineLatest } from "rxjs"
import { blobList$, setContainer$, blobContainer$ } from "../utils/storage-helper"
import { switchMap, concat, map, tap, shareReplay } from "rxjs/operators"
import { BlobItem, ContainerClient } from "@azure/storage-blob"
import { write } from "../utils/file-helper"

export const download$ = combineLatest(
    blobList$.pipe(
        switchMap(res => 
            concat(...res.map(el => of(el)))
        ),
    ),
    of('abc')
    // blobContainer$.pipe(
    //     shareReplay(1)
    // )
).pipe(
    // switchMap(res => 
    //     concat(...res[0].map(el => of([el, res[1]])))
    // ),
    tap(res => console.log('tester', res))
    // switchMap<[BlobItem, ContainerClient], Observable<string>>(res => from(
    //     res[1].getBlockBlobClient(res[0].name).download(0)
    // ).pipe(
    //     switchMap(x => from(
    //         write('BlobTemp', containerName + '/' + res[0].name, x.readableStreamBody) || ''
    //     ))
    // )),
)