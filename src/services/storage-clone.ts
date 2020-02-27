import { Observable, from, concat, combineLatest, iif, of } from "rxjs"
import { blobList$, setContainer$, blobContainer$ } from "../utils/storage-helper"
import { switchMap, tap, mapTo, skip } from "rxjs/operators"
import { BlobItem, ContainerClient } from "@azure/storage-blob"
import { write, resolveFolder, transport$ } from "../utils/file-helper"
import { renameSync, existsSync, rmdirSync } from 'fs'
import { resolve } from 'path'

const folderName = 'BlobTemp'

export const find$ = (containerName: string) => new Observable<BlobItem[]>(sub => {
    blobList$.subscribe(res => sub.next(res), err => sub.error(err), () => sub.complete())
    setContainer$.next(containerName)
})

export const mirror$ = (containerName: string, remote: boolean = false) => new Observable<[BlobItem[], ContainerClient, string]>(sub => {
    const folderPath = resolveFolder(resolveFolder(`../${folderName}`), containerName)

    combineLatest(blobList$, blobContainer$)
    .subscribe(res => sub.next([res[0], res[1], folderPath]), err => sub.error(err), () => sub.complete())

    setContainer$.next(containerName)
}).pipe(
    switchMap(res => concat(
        ...res[0].map(el => 
            from(res[1].getBlockBlobClient(el.name).download(0)).pipe(
                tap(() => console.log(`Streaming - ${el.name}`)),
                switchMap(x => from(write(res[2], el.name, x.readableStreamBody)))
            )
        )
    ).pipe(
        tap(res => console.log(`Downloaded ${res}`)),
        skip(res[0].length - 1),
        mapTo(res[0])
    )),
    switchMap(res => iif(() => remote, transport$(folderName), of(res)))
)

export const replace = (containerName: string, targetPath: string) => {
    const tempFolder = resolve(process.env.TEMP_PATH!, folderName, containerName)

    if(!existsSync(tempFolder)) 
        throw Error(`${folderName} Not found! Likely an error with remote transport from source server`)

    const oldFolder = resolve(targetPath, `${containerName}.old`)
    const folder = resolve(targetPath, containerName)
    if(existsSync(oldFolder)) rmdirSync(oldFolder, { recursive: true })
    if(existsSync(folder)) renameSync(folder, oldFolder)
    
    renameSync(tempFolder, folder)
    console.log(`Moved ${tempFolder} to ${folder} backed up old`)
    rmdirSync(tempFolder, { recursive: true })
}