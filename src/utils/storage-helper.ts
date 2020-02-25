import { Observable, Subject, from, of } from 'rxjs'
import { map, switchMap, expand, share, combineAll, takeWhile, tap } from 'rxjs/operators'
import { BlobServiceClient, BlobItem } from '@azure/storage-blob'

/**
 * Set the container to access, this will trigger an update in blobContainer.
 */
export const setContainer$ = new Subject<string>()

/**
 * Access a container set by setContainer. The Observable will remain open to deliver
 * new containers when set by setContainer.
 */
export const blobContainer$ = new Observable<BlobServiceClient>(sub =>
    sub.next(BlobServiceClient.fromConnectionString(connectionString()))
).pipe(
    switchMap(res => setContainer$.pipe(
        map(x => res.getContainerClient(x))
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
export const blobBatch$ = new Observable<BlobServiceClient>(sub => {
    sub.next(BlobServiceClient.fromConnectionString(connectionString()))
    sub.complete()
}
).pipe(
    map(res => res.getBlobBatchClient()),
    share()
)

/**
 * Builds an url representing the blob resource, mainly for use with blobBatch
 * because it uses blob URL instead of something more abstract.
 * @param containerName The name of the container to access
 * @param blobName The name of the blob to access
 */
export const blobUrl = (containerName?: string, blobName?: string) => `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME!}.blob.core.windows.net${(containerName ? `/${containerName}` : '') + (blobName ? `/${blobName}` : '') }`

/**
 * Builds a Connection String used to connect to Azure Blob Storage
 */
export const connectionString = () => `DefaultEndpointsProtocol=https;AccountName=${process.env.AZURE_STORAGE_ACCOUNT_NAME!};AccountKey=${process.env.AZURE_STORAGE_ACCOUNT_KEY!};EndpointSuffix=core.windows.net`