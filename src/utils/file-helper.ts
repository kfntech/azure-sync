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
        exec$(`scp -r ${res} scpuser@${process.env.MIRROR_HOST}:${process.env.MIRROR_DESTINATION}/${folderName}`).pipe(
            tap(res => console.log('scp out: ', res)),
            mapTo(res)
        )
    ),
    tap(res => console.log(`SCP complete, deleting ${res}`)),
    tap(res => rmdirSync(res, { recursive: true }))
)

export const write = (folderName: string, fileName: string, readerStream?: NodeJS.ReadableStream) => {
    if(!readerStream) return
    
    const path = resolve('../', folderName, fileName)
    if(!existsSync(path)) return

    return new Promise<string>((resolvePromise, reject) => {
        console.log(`filestream - ${fileName}`)
        // Create a writable stream
        var writerStream = createWriteStream(path)
        readerStream.on('end', () => {
            console.log(`true complete ${fileName}`)
            resolvePromise(fileName)
        })
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