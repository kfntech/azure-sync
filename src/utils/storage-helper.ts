import { Observable, Subject, from, of } from 'rxjs'
import { map, switchMap, expand, share, combineAll, takeWhile } from 'rxjs/operators'
import { BlobServiceClient, BlobItem } from '@azure/storage-blob'

export const setContainer$ = new Subject<string>()

export const blobContainer$ = new Observable<BlobServiceClient>(sub =>
    sub.next(BlobServiceClient.fromConnectionString(connectionString()))
).pipe(
    switchMap(res => setContainer$.pipe(
        map(x => res.getContainerClient(x))
    )),
    share()
)

export const blobList$ = blobContainer$.pipe(
    map(res => res.listBlobsFlat()),
    switchMap(iterator => from(iterator.next()).pipe(
        expand(() => iterator.next()),
        takeWhile(x => !x.done),
        map(x => of(x.value)),
        combineAll<BlobItem>()
    )),
)

export const blobBatch$ = new Observable<BlobServiceClient>(sub =>
    sub.next(BlobServiceClient.fromConnectionString(connectionString()))
).pipe(
    map(res => res.getBlobBatchClient()),
    share()
)

export const blobUrl = (containerName?: string, blobName?: string) => `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME!}.blob.core.windows.net${containerName ? `/${containerName}` : '' + blobName ? `/${blobName}` : '' }`

export const connectionString = () => `DefaultEndpointsProtocol=https;AccountName=${process.env.AZURE_STORAGE_ACCOUNT_NAME!};AccountKey=${process.env.AZURE_STORAGE_ACCOUNT_KEY!};EndpointSuffix=core.windows.net`