import { Observable, Subject } from 'rxjs';
export declare const setContainer$: Subject<string>;
export declare const blobContainer$: Observable<import("@azure/storage-blob").ContainerClient>;
export declare const blobList$: Observable<import("@azure/storage-blob").BlobItem>;
