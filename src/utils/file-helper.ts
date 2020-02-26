import { exec } from 'child_process'
import { bindNodeCallback, Observable } from 'rxjs'
import { resolve } from 'path'
import { tap, switchMap, mapTo } from 'rxjs/operators'
import { existsSync, mkdirSync, rmdirSync, createWriteStream } from 'fs'

export const exec$ = bindNodeCallback(exec)

/**
 * SCP will be used to transport the folder to MIRROR server's destination folder.
 * After that, the original folder will be deleted.
 * @param folderName Name of the folder to be transported.
 */
export const transport$ = (folderName: string) => new Observable<string>(sub => {
    const path = resolve('../', folderName)
    existsSync(path) ? sub.next(path) : sub.error(new Error('Folder not found!'))
    sub.complete()
}).pipe(
    tap(res => console.log(`SCP began for ${res}`)),
    switchMap(res => 
        exec$(`scp -r ${res} scpuser@${process.env.REMOTE_ADDRESS}/${folderName}`).pipe(
            tap(res => console.log('scp out: ', res)),
            mapTo(res)
        )
    ),
    tap(res => console.log(`SCP complete, deleting ${res}`)),
    tap(res => rmdirSync(res, { recursive: true }))
)

export const write = (folderName: string, blobName: string, readerStream?: NodeJS.ReadableStream) => {
    return new Promise<string>((resolvePromise, reject) => {
        if(!readerStream) return reject('No stream found')
        if(!existsSync(folderName)) return reject('Folder not found!')

        const path = resolve(folderName, blobName)
        // Create a writable stream
        var writerStream = createWriteStream(path)
        readerStream.on('end', () => resolvePromise(path))
        writerStream.on('error', err => reject(err))
        // Pipe the read and write operations
        // read input.txt and write data to output.txt
        readerStream.pipe(writerStream)
    })
}

export const resolveFolder = (...pathSegments: string[]) => {
    const folderPath = resolve(...pathSegments)
    !existsSync(folderPath) ? mkdirSync(folderPath) : rmdirSync(`${folderPath}/*`, { recursive: true })
    return folderPath
}