import { Subject, from, of } from 'rxjs'
import { map, switchMap, expand, share, combineAll, takeWhile, tap, withLatestFrom } from 'rxjs/operators'
import { BlobServiceClient, BlobItem } from '@azure/storage-blob'

/**
 * Set the container to access, this will trigger an update in blobContainer.
 */
export const setContainer$ = new Subject<string>()

/**
 * Access a container set by setContainer. The Observable will remain open to deliver
 * new containers when set by setContainer.
 */
export const blobContainer$ = of(BlobServiceClient).pipe(
    map(res => res.fromConnectionString(connectionString())),
    switchMap(res => setContainer$.pipe(
        map(x => res.getContainerClient(x)),
        tap(() => console.log('Created blob container client'))
    )),
    share()
)

/**
 * Lists all the blob within a container set by setContainer. The Observable will update
 * when a new container is set by setContainer.
 */
export const blobList$ = blobContainer$.pipe(
    map(res => res.listBlobsFlat()),
    switchMap(iterator => from(iterator.next()).pipe(
        expand(() => iterator.next()),
        takeWhile(x => !x.done),
        map(x => of(x.value)),
        combineAll<BlobItem>()
    )),
    tap(res => console.log(`${res.length} blob names fetched`))
)

/**
 * Configures a client for sending batch requests. The Observable completes immediately.
 */
export const blobBatch$ = of(BlobServiceClient).pipe(
    map(res => res.fromConnectionString(connectionString())),
    map(res => res.getBlobBatchClient()),
    tap(() => console.log('Created blob batch client')),
    share()
)

/**
 * Builds an url representing the blob resource, mainly for use with blobBatch
 * because it uses blob URL instead of something more abstract.
 * @param containerName The name of the container to access
 * @param blobName The name of the blob to access
 */
export const blobUrl = (containerName?: string, blobName?: string) => `https://${extractString('AccountName')}.blob.core.windows.net${(containerName ? `/${containerName}` : '') + (blobName ? `/${blobName}` : '') }`

/**
 * Builds a Connection String used to connect to Azure Blob Storage
 */
export const connectionString = () => process.env.AZURE_STORAGE_CONNECTION_STRING!

export const extractString = (key: string) => {
    let chunk = process.env.AZURE_STORAGE_CONNECTION_STRING!.split(';').find(el => el.startsWith(key))!
    return chunk.slice(chunk.indexOf('='), chunk.length - 1)
}